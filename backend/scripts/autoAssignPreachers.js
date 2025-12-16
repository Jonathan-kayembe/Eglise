import dotenv from 'dotenv';
import { createConnection, getConnection } from '../config/database.js';
import { searchPreacherByName } from '../services/preacherService.js';
import { normalizeName } from '../utils/searchUtils.js';

dotenv.config();

/**
 * Patterns pour extraire les noms de prédicateurs depuis les titres
 * Amélioré pour capturer les noms avec accents et variations
 */
const PREACHER_PATTERNS = [
  // "Frère Nom Prénom" ou "Brother Nom Prénom" (avec accents supportés, jusqu'à 4 mots)
  /(?:Frère|Fr|Brother|Br)\.?\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+(?:\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+){0,3})/,
  // " - Frère Nom" ou " | Frère Nom"
  /[|\-]\s*(?:Frère|Fr|Brother|Br)\.?\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+(?:\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+){0,3})/,
  // "Frère Nom :" ou "Frère Nom," (capture jusqu'à 4 mots pour les noms complets)
  /(?:Frère|Fr|Brother|Br)\.?\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+(?:\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+){0,3})(?:\s*[,:\-]|$)/,
  // Pattern plus flexible pour capturer même sans préfixe "Frère"
  /\b([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+)\b/,
];

/**
 * Extrait le nom du prédicateur depuis un titre de vidéo
 */
const extractPreacherFromTitle = (title) => {
  if (!title) return null;

  for (const pattern of PREACHER_PATTERNS) {
    const match = title.match(pattern);
    if (match && match[1]) {
      let name = match[1].trim();
      
      // Nettoyer le nom mais préserver les accents et les noms complets
      name = name
        .replace(/^[|\-]\s*/, '') // Enlever les préfixes de séparation
        .replace(/\s*[,:\-].*$/, '') // Enlever tout après : , ou -
        .replace(/\s+/g, ' ') // Normaliser les espaces
        .trim();
      
      // Vérifier que c'est un nom valide (au moins 3 caractères, pas juste des caractères spéciaux)
      if (name.length >= 3 && /^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\s]+$/.test(name)) {
        // Capitaliser correctement (première lettre de chaque mot en majuscule)
        name = name.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        return name;
      }
    }
  }

  return null;
};

/**
 * Trouve ou crée un prédicateur par nom
 */
const findOrCreatePreacher = async (name) => {
  const db = getConnection();
  
  // Normaliser le nom pour la recherche
  const normalized = normalizeName(name);
  
  // Chercher d'abord par nom exact
  const [exact] = await db.execute(
    'SELECT * FROM preachers WHERE LOWER(REPLACE(REPLACE(name, "Frère ", ""), "Brother ", "")) = ?',
    [normalized]
  );
  
  if (exact.length > 0) {
    return exact[0];
  }
  
  // Chercher avec fuzzy search
  const allPreachers = await db.execute('SELECT * FROM preachers');
  for (const preacher of allPreachers[0]) {
    const preacherNormalized = normalizeName(preacher.name);
    if (preacherNormalized === normalized || 
        preacherNormalized.includes(normalized) || 
        normalized.includes(preacherNormalized)) {
      return preacher;
    }
  }
  
  // Créer un nouveau prédicateur
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  const [result] = await db.execute(
    'INSERT INTO preachers (name, slug) VALUES (?, ?)',
    [name, slug]
  );
  
  const [newPreacher] = await db.execute(
    'SELECT * FROM preachers WHERE id = ?',
    [result.insertId]
  );
  
  console.log(`   ✅ Créé: "${name}" (ID ${result.insertId})`);
  return newPreacher[0];
};

/**
 * Associe automatiquement les prédicateurs aux vidéos
 */
const autoAssignPreachers = async (dryRun = true) => {
  try {
    await createConnection();
    const db = getConnection();
    
    console.log('🔍 Extraction des prédicateurs depuis les titres de vidéos...\n');
    
    // Récupérer toutes les vidéos sans prédicateur
    const [videos] = await db.execute(
      'SELECT * FROM videos WHERE preacher_id IS NULL ORDER BY published_at DESC'
    );
    
    console.log(`📹 ${videos.length} vidéo(s) sans prédicateur trouvée(s)\n`);
    
    if (videos.length === 0) {
      console.log('✅ Toutes les vidéos ont déjà un prédicateur associé!\n');
      return;
    }
    
    let assigned = 0;
    let created = 0;
    let errors = 0;
    const preachersMap = new Map();
    const extractionStats = new Map(); // Pour voir quels noms sont extraits
    
    for (const video of videos) {
      try {
        const preacherName = extractPreacherFromTitle(video.title);
        
        if (!preacherName) {
          if (dryRun) {
            console.log(`   ⚠️  Pas de prédicateur trouvé dans: "${video.title.substring(0, 60)}..."`);
          }
          continue;
        }
        
        // Statistiques d'extraction
        extractionStats.set(preacherName, (extractionStats.get(preacherName) || 0) + 1);
        
        // Utiliser le cache si disponible
        let preacher;
        if (preachersMap.has(preacherName)) {
          preacher = preachersMap.get(preacherName);
        } else {
          preacher = await findOrCreatePreacher(preacherName);
          preachersMap.set(preacherName, preacher);
          
          if (!preacher.id) {
            // Nouveau prédicateur créé
            const [newPreacher] = await db.execute(
              'SELECT * FROM preachers WHERE name = ?',
              [preacherName]
            );
            preacher = newPreacher[0];
            created++;
          }
        }
        
        if (!dryRun) {
          await db.execute(
            'UPDATE videos SET preacher_id = ? WHERE id = ?',
            [preacher.id, video.id]
          );
          console.log(`   ✅ "${video.title.substring(0, 50)}..." → "${preacher.name}"`);
        } else {
          console.log(`   📝 "${video.title.substring(0, 50)}..." → "${preacher.name}" (à associer)`);
        }
        
        assigned++;
      } catch (error) {
        console.error(`   ❌ Erreur pour la vidéo ${video.id}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📊 Résumé:');
    console.log(`   ✅ ${assigned} vidéo(s) ${dryRun ? 'seraient associée(s)' : 'associée(s)'}`);
    console.log(`   🆕 ${created} nouveau(x) prédicateur(s) ${dryRun ? 'serait créé' : 'créé(s)'}`);
    if (errors > 0) {
      console.log(`   ❌ ${errors} erreur(s)`);
    }
    
    // Afficher les noms extraits pour vérification
    if (dryRun && extractionStats.size > 0) {
      console.log('\n📝 Noms de prédicateurs extraits:');
      const sortedStats = Array.from(extractionStats.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20); // Top 20
      sortedStats.forEach(([name, count]) => {
        console.log(`   - "${name}" (${count} vidéo${count > 1 ? 's' : ''})`);
      });
    }
    
    if (dryRun) {
      console.log('\n💡 Mode DRY RUN - Aucune modification effectuée');
      console.log('💡 Relancez avec --apply pour appliquer les changements\n');
    } else {
      console.log('\n✅ Association terminée!\n');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

// Exécuter le script
const args = process.argv.slice(2);
const apply = args.includes('--apply');

autoAssignPreachers(!apply).then(() => {
  process.exit(0);
});

