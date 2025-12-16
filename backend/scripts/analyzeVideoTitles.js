import dotenv from 'dotenv';
import { createConnection, getConnection } from '../config/database.js';

dotenv.config();

/**
 * Script pour analyser les titres de vidéos et voir comment les noms de prédicateurs apparaissent
 */
const analyzeVideoTitles = async () => {
  try {
    await createConnection();
    const db = getConnection();
    
    console.log('🔍 Analyse des titres de vidéos pour trouver "François Mudioko"...\n');
    
    // Rechercher toutes les vidéos qui contiennent "François" ou "Mudioko"
    const [videos] = await db.execute(
      `SELECT id, title, preacher_id 
       FROM videos 
       WHERE LOWER(title) LIKE '%françois%' 
          OR LOWER(title) LIKE '%francois%' 
          OR LOWER(title) LIKE '%mudioko%'
          OR LOWER(title) LIKE '%mudiko%'
       ORDER BY published_at DESC
       LIMIT 50`
    );
    
    if (videos.length === 0) {
      console.log('❌ Aucune vidéo trouvée contenant "François" ou "Mudioko"');
      console.log('\n💡 Essayons de voir quelques exemples de titres de vidéos...\n');
      
      const [sampleVideos] = await db.execute(
        'SELECT title FROM videos WHERE preacher_id IS NULL ORDER BY published_at DESC LIMIT 20'
      );
      
      if (sampleVideos.length > 0) {
        console.log('📹 Exemples de titres de vidéos sans prédicateur:');
        sampleVideos.forEach((v, i) => {
          console.log(`   ${i + 1}. ${v.title}`);
        });
      }
      
      process.exit(0);
    }
    
    console.log(`✅ ${videos.length} vidéo(s) trouvée(s) contenant "François" ou "Mudioko"\n`);
    
    const withPreacher = videos.filter(v => v.preacher_id).length;
    const withoutPreacher = videos.length - withPreacher;
    
    console.log(`📊 Statistiques:`);
    console.log(`   ✅ ${withPreacher} vidéo(s) avec prédicateur`);
    console.log(`   ⚠️  ${withoutPreacher} vidéo(s) sans prédicateur\n`);
    
    console.log('📹 Titres de vidéos trouvées:\n');
    videos.forEach((video, index) => {
      const status = video.preacher_id ? '✅' : '⚠️ ';
      console.log(`${status} ${index + 1}. [ID ${video.id}] ${video.title}`);
      
      // Essayer d'extraire le nom du prédicateur du titre
      const patterns = [
        /(?:Frère|Fr|Brother|Br)\.?\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+(?:\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+)*)/i,
        /[|\-]\s*(?:Frère|Fr|Brother|Br)\.?\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+(?:\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+)*)/i,
      ];
      
      for (const pattern of patterns) {
        const match = video.title.match(pattern);
        if (match && match[1]) {
          console.log(`      → Nom extrait: "${match[1].trim()}"`);
          break;
        }
      }
      
      if (!video.preacher_id) {
        console.log(`      ⚠️  Pas de prédicateur associé`);
      }
      console.log('');
    });
    
    if (withoutPreacher > 0) {
      console.log(`\n💡 Pour associer ces ${withoutPreacher} vidéo(s) à "François Mudioko":`);
      console.log(`   1. Vérifiez que le prédicateur existe: node scripts/addPreacher.js "François Mudioko"`);
      console.log(`   2. Utilisez le script d'association amélioré`);
      console.log(`   3. Ou associez manuellement via SQL:\n`);
      console.log(`   UPDATE videos SET preacher_id = (SELECT id FROM preachers WHERE name = 'François Mudioko')`);
      console.log(`   WHERE id IN (${videos.filter(v => !v.preacher_id).map(v => v.id).join(', ')});\n`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

analyzeVideoTitles().then(() => {
  process.exit(0);
});

