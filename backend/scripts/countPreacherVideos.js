import dotenv from 'dotenv';
import { createConnection, getConnection } from '../config/database.js';

dotenv.config();

/**
 * Script pour compter et lister les vidéos d'un prédicateur
 * Usage: node scripts/countPreacherVideos.js "François Mudioko"
 */
const countPreacherVideos = async () => {
  try {
    await createConnection();
    const db = getConnection();
    
    const args = process.argv.slice(2);
    const preacherName = args[0] || 'François Mudioko';
    
    console.log(`🔍 Recherche des vidéos pour "${preacherName}"...\n`);
    
    // Patterns de recherche flexibles pour "François Mudioko"
    const searchTerms = [
      'françois',
      'francois',
      'mudioko',
      'mudiko',
      'mudioco',
      'mudico'
    ];
    
    // Construire la requête SQL avec plusieurs LIKE
    const likeConditions = searchTerms.map(term => `LOWER(title) LIKE '%${term}%'`).join(' OR ');
    
    const [videos] = await db.execute(
      `SELECT id, title, preacher_id, published_at, view_count
       FROM videos 
       WHERE ${likeConditions}
       ORDER BY published_at DESC`
    );
    
    if (videos.length === 0) {
      console.log(`❌ Aucune vidéo trouvée contenant "${preacherName}" ou ses variations\n`);
      process.exit(0);
    }
    
    // Séparer les vidéos avec et sans prédicateur
    const withPreacher = videos.filter(v => v.preacher_id);
    const withoutPreacher = videos.filter(v => !v.preacher_id);
    
    // Vérifier si certaines sont associées à "François Mudioko"
    const [preacher] = await db.execute(
      'SELECT id, name FROM preachers WHERE name LIKE ?',
      [`%${preacherName}%`]
    );
    
    let assignedToPreacher = [];
    if (preacher.length > 0) {
      const preacherId = preacher[0].id;
      assignedToPreacher = videos.filter(v => v.preacher_id === preacherId);
    }
    
    console.log(`📊 RÉSULTATS POUR "${preacherName}":\n`);
    console.log(`═══════════════════════════════════════════════════════════\n`);
    console.log(`📹 TOTAL: ${videos.length} vidéo(s) trouvée(s)\n`);
    console.log(`   ✅ ${assignedToPreacher.length} vidéo(s) associée(s) à "${preacherName}"`);
    console.log(`   ⚠️  ${withPreacher.length - assignedToPreacher.length} vidéo(s) associée(s) à un autre prédicateur`);
    console.log(`   ❌ ${withoutPreacher.length} vidéo(s) sans prédicateur associé\n`);
    
    // Afficher les détails
    console.log(`📋 DÉTAILS DES VIDÉOS:\n`);
    
    if (assignedToPreacher.length > 0) {
      console.log(`✅ Vidéos associées à "${preacherName}":`);
      assignedToPreacher.slice(0, 10).forEach((video, index) => {
        const date = video.published_at ? new Date(video.published_at).toLocaleDateString('fr-FR') : 'N/A';
        const views = video.view_count ? video.view_count.toLocaleString('fr-FR') : '0';
        console.log(`   ${index + 1}. [ID ${video.id}] ${video.title.substring(0, 60)}${video.title.length > 60 ? '...' : ''}`);
        console.log(`      📅 ${date} | 👁️  ${views} vues`);
      });
      if (assignedToPreacher.length > 10) {
        console.log(`   ... et ${assignedToPreacher.length - 10} autre(s) vidéo(s)\n`);
      } else {
        console.log('');
      }
    }
    
    if (withoutPreacher.length > 0) {
      console.log(`❌ Vidéos SANS prédicateur (à associer):`);
      withoutPreacher.slice(0, 10).forEach((video, index) => {
        const date = video.published_at ? new Date(video.published_at).toLocaleDateString('fr-FR') : 'N/A';
        const views = video.view_count ? video.view_count.toLocaleString('fr-FR') : '0';
        console.log(`   ${index + 1}. [ID ${video.id}] ${video.title.substring(0, 60)}${video.title.length > 60 ? '...' : ''}`);
        console.log(`      📅 ${date} | 👁️  ${views} vues`);
      });
      if (withoutPreacher.length > 10) {
        console.log(`   ... et ${withoutPreacher.length - 10} autre(s) vidéo(s)\n`);
      } else {
        console.log('');
      }
    }
    
    if (withPreacher.length - assignedToPreacher.length > 0) {
      console.log(`⚠️  Vidéos associées à un AUTRE prédicateur:`);
      const otherPreachers = videos.filter(v => v.preacher_id && (!preacher.length || v.preacher_id !== preacher[0].id));
      otherPreachers.slice(0, 5).forEach((video, index) => {
        const [preacherInfo] = await db.execute(
          'SELECT name FROM preachers WHERE id = ?',
          [video.preacher_id]
        );
        const preacherName = preacherInfo[0]?.name || 'Inconnu';
        console.log(`   ${index + 1}. [ID ${video.id}] ${video.title.substring(0, 50)}...`);
        console.log(`      → Associée à: "${preacherName}"`);
      });
      if (otherPreachers.length > 5) {
        console.log(`   ... et ${otherPreachers.length - 5} autre(s) vidéo(s)\n`);
      } else {
        console.log('');
      }
    }
    
    console.log(`═══════════════════════════════════════════════════════════\n`);
    
    // Suggestions
    if (withoutPreacher.length > 0) {
      console.log(`💡 Pour associer les ${withoutPreacher.length} vidéo(s) sans prédicateur:`);
      console.log(`   1. node scripts/assignPreacherToVideos.js "${preacherName}" "françois|mudioko|francois" --apply`);
      console.log(`   2. Ou utilisez SQL directement:\n`);
      if (preacher.length > 0) {
        console.log(`   UPDATE videos SET preacher_id = ${preacher[0].id}`);
        console.log(`   WHERE id IN (${withoutPreacher.map(v => v.id).join(', ')});\n`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

countPreacherVideos().then(() => {
  process.exit(0);
});

