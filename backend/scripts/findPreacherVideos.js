import dotenv from 'dotenv';
import { createConnection, getConnection } from '../config/database.js';
import { normalizeName } from '../utils/searchUtils.js';

dotenv.config();

/**
 * Script pour trouver les vidéos d'un prédicateur en analysant les titres
 * Usage: node scripts/findPreacherVideos.js "François Mudioko"
 */
const findPreacherVideos = async () => {
  try {
    await createConnection();
    const db = getConnection();
    
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
      console.log('❌ Usage: node scripts/findPreacherVideos.js "Nom du Prédicateur"');
      console.log('   Exemple: node scripts/findPreacherVideos.js "François Mudioko"');
      process.exit(1);
    }
    
    const searchName = args.join(' ');
    const normalizedSearch = normalizeName(searchName);
    
    console.log(`🔍 Recherche des vidéos pour "${searchName}"...\n`);
    console.log(`📝 Nom normalisé pour recherche: "${normalizedSearch}"\n`);
    
    // Récupérer toutes les vidéos
    const [allVideos] = await db.execute(
      'SELECT * FROM videos ORDER BY published_at DESC'
    );
    
    console.log(`📹 Analyse de ${allVideos.length} vidéo(s)...\n`);
    
    // Patterns de recherche flexibles
    const searchPatterns = [
      // Recherche exacte
      new RegExp(searchName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      // Recherche normalisée
      new RegExp(normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      // Recherche par mots (François OU Mudioko)
      new RegExp(searchName.split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i'),
      // Recherche avec variations d'accents
      new RegExp(searchName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    ];
    
    const matchingVideos = [];
    const variations = new Set();
    
    for (const video of allVideos) {
      if (!video.title) continue;
      
      const title = video.title;
      const normalizedTitle = normalizeName(title);
      
      // Vérifier chaque pattern
      for (const pattern of searchPatterns) {
        if (pattern.test(title) || pattern.test(normalizedTitle)) {
          // Extraire le nom trouvé dans le titre
          const match = title.match(/(?:Frère|Fr|Brother|Br)\.?\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+(?:\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+)*)/i);
          
          if (match && match[1]) {
            variations.add(match[1].trim());
          }
          
          matchingVideos.push({
            id: video.id,
            title: video.title,
            publishedAt: video.published_at,
            preacherId: video.preacher_id
          });
          break; // Ne pas compter deux fois la même vidéo
        }
      }
    }
    
    if (matchingVideos.length === 0) {
      console.log(`❌ Aucune vidéo trouvée pour "${searchName}"`);
      console.log(`\n💡 Suggestions:`);
      console.log(`   - Vérifiez l'orthographe du nom`);
      console.log(`   - Essayez des variations (avec/sans accents)`);
      console.log(`   - Utilisez: npm run list-preachers pour voir tous les prédicateurs\n`);
      process.exit(0);
    }
    
    console.log(`✅ ${matchingVideos.length} vidéo(s) trouvée(s)!\n`);
    
    // Afficher les variations de noms trouvées
    if (variations.size > 0) {
      console.log(`📝 Variations du nom trouvées dans les titres:`);
      Array.from(variations).sort().forEach(v => {
        console.log(`   - "${v}"`);
      });
      console.log('');
    }
    
    // Afficher les vidéos
    console.log('📹 Vidéos trouvées:\n');
    matchingVideos.slice(0, 20).forEach((video, index) => {
      const status = video.preacherId ? '✅' : '⚠️ ';
      console.log(`${status} ${index + 1}. [ID ${video.id}] ${video.title.substring(0, 70)}${video.title.length > 70 ? '...' : ''}`);
      if (!video.preacherId) {
        console.log(`      ⚠️  Pas de prédicateur associé`);
      }
    });
    
    if (matchingVideos.length > 20) {
      console.log(`\n   ... et ${matchingVideos.length - 20} autre(s) vidéo(s)`);
    }
    
    // Statistiques
    const withPreacher = matchingVideos.filter(v => v.preacherId).length;
    const withoutPreacher = matchingVideos.length - withPreacher;
    
    console.log(`\n📊 Statistiques:`);
    console.log(`   ✅ ${withPreacher} vidéo(s) avec prédicateur associé`);
    console.log(`   ⚠️  ${withoutPreacher} vidéo(s) sans prédicateur associé`);
    
    if (withoutPreacher > 0) {
      console.log(`\n💡 Pour associer ces vidéos au prédicateur "${searchName}":`);
      console.log(`   1. Créez le prédicateur: node scripts/addPreacher.js "${searchName}"`);
      console.log(`   2. Utilisez: npm run auto-assign-preachers:apply`);
      console.log(`   3. Ou associez manuellement via SQL\n`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

findPreacherVideos().then(() => {
  process.exit(0);
});

