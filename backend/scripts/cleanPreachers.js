import dotenv from 'dotenv';
import { createConnection, getConnection } from '../config/database.js';

dotenv.config();

/**
 * Normalise un nom de prédicateur pour la comparaison
 */
const normalizeName = (name) => {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    // Normaliser les préfixes
    .replace(/^(frère|fr|brother|br)\.?\s*/i, '')
    // Normaliser les accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Enlever les espaces multiples
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Calcule la similarité entre deux noms (algorithme de Levenshtein simplifié)
 */
const similarity = (str1, str2) => {
  const s1 = normalizeName(str1);
  const s2 = normalizeName(str2);
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Vérifier si les mots sont les mêmes mais dans un ordre différent
  const words1 = s1.split(' ').filter(w => w.length > 2).sort();
  const words2 = s2.split(' ').filter(w => w.length > 2).sort();
  
  if (words1.length === words2.length && words1.length >= 2) {
    const matchingWords = words1.filter(w => words2.includes(w));
    if (matchingWords.length >= 2) {
      // Si au moins 2 mots correspondent, c'est probablement le même prédicateur
      return 0.85;
    }
  }
  
  // Distance de Levenshtein simplifiée
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(longer, shorter);
  return 1 - (distance / longer.length);
};

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * Trouve les doublons de prédicateurs
 */
const findDuplicates = async () => {
  const db = getConnection();
  const [preachers] = await db.execute('SELECT * FROM preachers ORDER BY name');
  
  const duplicates = [];
  const processed = new Set();
  
  for (let i = 0; i < preachers.length; i++) {
    if (processed.has(preachers[i].id)) continue;
    
    const group = [preachers[i]];
    const normalized1 = normalizeName(preachers[i].name);
    
    for (let j = i + 1; j < preachers.length; j++) {
      if (processed.has(preachers[j].id)) continue;
      
      const normalized2 = normalizeName(preachers[j].name);
      const sim = similarity(preachers[i].name, preachers[j].name);
      
      // Si similarité > 0.7, considérer comme doublon
      if (sim > 0.7 || normalized1 === normalized2) {
        group.push(preachers[j]);
        processed.add(preachers[j].id);
      }
    }
    
    if (group.length > 1) {
      duplicates.push(group);
      processed.add(preachers[i].id);
    }
  }
  
  return duplicates;
};

/**
 * Nettoie les doublons en gardant le prédicateur avec le plus de vidéos
 */
const cleanDuplicates = async (dryRun = true) => {
  try {
    await createConnection();
    const db = getConnection();
    
    console.log('🔍 Recherche des doublons de prédicateurs...\n');
    
    const duplicates = await findDuplicates();
    
    if (duplicates.length === 0) {
      console.log('✅ Aucun doublon trouvé!\n');
      return;
    }
    
    console.log(`⚠️  ${duplicates.length} groupe(s) de doublons trouvé(s):\n`);
    
    for (const group of duplicates) {
      console.log('📋 Groupe de doublons:');
      
      // Trouver le prédicateur avec le plus de vidéos
      const videoCounts = await Promise.all(
        group.map(async (p) => {
          const [count] = await db.execute(
            'SELECT COUNT(*) as total FROM videos WHERE preacher_id = ?',
            [p.id]
          );
          return { preacher: p, count: count[0].total };
        })
      );
      
      // Afficher les informations de chaque prédicateur
      for (const { preacher, count } of videoCounts) {
        console.log(`   - ID ${preacher.id}: "${preacher.name}" (${count} vidéos)`);
      }
      
      videoCounts.sort((a, b) => b.count - a.count);
      const keeper = videoCounts[0].preacher;
      const toMerge = videoCounts.slice(1);
      
      console.log(`\n   ✅ Garder: "${keeper.name}" (ID ${keeper.id})`);
      
      if (!dryRun) {
        // Fusionner les vidéos vers le prédicateur à garder
        for (const { preacher } of toMerge) {
          console.log(`   🔄 Fusion de "${preacher.name}" (ID ${preacher.id}) vers "${keeper.name}"...`);
          
          // Mettre à jour les vidéos
          await db.execute(
            'UPDATE videos SET preacher_id = ? WHERE preacher_id = ?',
            [keeper.id, preacher.id]
          );
          
          // Supprimer le doublon
          await db.execute('DELETE FROM preachers WHERE id = ?', [preacher.id]);
          console.log(`   ✅ Supprimé: "${preacher.name}" (ID ${preacher.id})`);
        }
      } else {
        console.log(`   📝 À fusionner:`);
        toMerge.forEach(({ preacher }) => {
          console.log(`      - "${preacher.name}" (ID ${preacher.id})`);
        });
      }
      
      console.log('');
    }
    
    if (dryRun) {
      console.log('💡 Mode DRY RUN - Aucune modification effectuée');
      console.log('💡 Relancez avec --apply pour appliquer les changements\n');
    } else {
      console.log('✅ Nettoyage terminé!\n');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

// Exécuter le script
const args = process.argv.slice(2);
const apply = args.includes('--apply');

cleanDuplicates(!apply).then(() => {
  process.exit(0);
});

