import dotenv from 'dotenv';
import { createConnection, getConnection } from '../config/database.js';

dotenv.config();

/**
 * Script pour compter toutes les vidéos d'un prédicateur dans la base de données
 * Usage: node scripts/countPreacherVideosInDB.js "François Mudioko"
 */
const countPreacherVideosInDB = async () => {
  try {
    await createConnection();
    const db = getConnection();
    
    const args = process.argv.slice(2);
    const searchName = args[0] || 'François Mudioko';
    
    console.log(`🔍 Recherche de toutes les vidéos de "${searchName}" dans la base de données...\n`);
    
    // Chercher tous les prédicateurs qui pourraient être François Mudioko
    const [allPreachers] = await db.execute(
      `SELECT * FROM preachers 
       WHERE LOWER(name) LIKE ? 
          OR LOWER(name) LIKE ? 
          OR LOWER(name) LIKE ?
          OR LOWER(name) LIKE ?
       ORDER BY name`,
      [
        `%françois%`,
        `%francois%`,
        `%mudioko%`,
        `%mudiko%`
      ]
    );
    
    if (allPreachers.length === 0) {
      console.log(`❌ Aucun prédicateur trouvé contenant "${searchName}"\n`);
      process.exit(0);
    }
    
    console.log(`📋 Prédicateur(s) trouvé(s):\n`);
    
    let totalVideos = 0;
    const preachersWithVideos = [];
    
    for (const preacher of allPreachers) {
      const [countResult] = await db.execute(
        'SELECT COUNT(*) as total FROM videos WHERE preacher_id = ?',
        [preacher.id]
      );
      
      const videoCount = countResult[0].total;
      totalVideos += videoCount;
      
      console.log(`   - ID ${preacher.id}: "${preacher.name}"`);
      console.log(`     📹 ${videoCount} vidéo(s)`);
      console.log(`     🔗 Slug: ${preacher.slug}\n`);
      
      if (videoCount > 0) {
        preachersWithVideos.push({
          preacher,
          count: videoCount
        });
      }
    }
    
    console.log(`═══════════════════════════════════════════════════════════\n`);
    console.log(`📊 TOTAL: ${totalVideos} vidéo(s) au total\n`);
    
    // Calculer le nombre de pages (12 vidéos par page)
    const videosPerPage = 12;
    const totalPages = Math.ceil(totalVideos / videosPerPage);
    const fullPages = Math.floor(totalVideos / videosPerPage);
    const videosOnLastPage = totalVideos % videosPerPage;
    
    console.log(`📄 PAGINATION (${videosPerPage} vidéos par page):`);
    console.log(`   📑 ${fullPages} page(s) complète(s) (${fullPages * videosPerPage} vidéos)`);
    if (videosOnLastPage > 0) {
      console.log(`   📄 1 page partielle avec ${videosOnLastPage} vidéo(s)`);
      console.log(`   📊 Total: ${totalPages} page(s)`);
    } else {
      console.log(`   📊 Total: ${fullPages} page(s)`);
    }
    console.log('');
    
    // Afficher les détails par prédicateur
    if (preachersWithVideos.length > 1) {
      console.log(`⚠️  ATTENTION: ${preachersWithVideos.length} prédicateur(s) différents trouvé(s)!`);
      console.log(`   Il y a probablement des doublons à fusionner.\n`);
      console.log(`💡 Pour fusionner les doublons:`);
      console.log(`   npm run clean-preachers:apply\n`);
    }
    
    // Afficher quelques exemples de vidéos
    if (preachersWithVideos.length > 0) {
      const mainPreacher = preachersWithVideos[0].preacher;
      const [sampleVideos] = await db.execute(
        `SELECT id, title, published_at, view_count 
         FROM videos 
         WHERE preacher_id = ? 
         ORDER BY published_at DESC 
         LIMIT 10`,
        [mainPreacher.id]
      );
      
      if (sampleVideos.length > 0) {
        console.log(`📹 Exemples de vidéos (${mainPreacher.name}):\n`);
        sampleVideos.forEach((video, index) => {
          const date = video.published_at ? new Date(video.published_at).toLocaleDateString('fr-FR') : 'N/A';
          const views = video.view_count ? video.view_count.toLocaleString('fr-FR') : '0';
          console.log(`   ${index + 1}. [ID ${video.id}] ${video.title.substring(0, 60)}${video.title.length > 60 ? '...' : ''}`);
          console.log(`      📅 ${date} | 👁️  ${views} vues`);
        });
        if (preachersWithVideos[0].count > 10) {
          console.log(`   ... et ${preachersWithVideos[0].count - 10} autre(s) vidéo(s)\n`);
        } else {
          console.log('');
        }
      }
    }
    
    console.log(`═══════════════════════════════════════════════════════════\n`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

countPreacherVideosInDB().then(() => {
  process.exit(0);
});

