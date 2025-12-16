import dotenv from 'dotenv';
import { createConnection, getConnection } from '../config/database.js';

dotenv.config();

/**
 * Script de diagnostic pour comprendre pourquoi un prédicateur a peu de vidéos
 * Usage: node scripts/diagnosePreacherVideos.js "François Mudioko"
 */
const diagnosePreacherVideos = async () => {
  try {
    await createConnection();
    const db = getConnection();
    
    const args = process.argv.slice(2);
    const searchName = args[0] || 'François Mudioko';
    
    console.log(`🔍 DIAGNOSTIC pour "${searchName}"...\n`);
    console.log(`═══════════════════════════════════════════════════════════\n`);
    
    // 1. Chercher le prédicateur exact
    const [exactPreacher] = await db.execute(
      'SELECT * FROM preachers WHERE name = ?',
      [searchName]
    );
    
    if (exactPreacher.length === 0) {
      console.log(`❌ Prédicateur "${searchName}" non trouvé exactement\n`);
    } else {
      const preacher = exactPreacher[0];
      const [countResult] = await db.execute(
        'SELECT COUNT(*) as total FROM videos WHERE preacher_id = ?',
        [preacher.id]
      );
      
      console.log(`✅ Prédicateur trouvé: "${preacher.name}" (ID ${preacher.id})`);
      console.log(`   📹 Vidéos associées: ${countResult[0].total}\n`);
    }
    
    // 2. Chercher tous les prédicateurs similaires
    console.log(`🔍 Recherche de tous les prédicateurs similaires...\n`);
    
    const [similarPreachers] = await db.execute(
      `SELECT p.*, COUNT(v.id) as video_count
       FROM preachers p
       LEFT JOIN videos v ON p.id = v.preacher_id
       WHERE LOWER(p.name) LIKE ? 
          OR LOWER(p.name) LIKE ? 
          OR LOWER(p.name) LIKE ?
          OR LOWER(p.name) LIKE ?
       GROUP BY p.id
       ORDER BY video_count DESC`,
      [
        `%françois%`,
        `%francois%`,
        `%mudioko%`,
        `%mudiko%`
      ]
    );
    
    if (similarPreachers.length === 0) {
      console.log(`❌ Aucun prédicateur similaire trouvé\n`);
    } else {
      console.log(`📋 ${similarPreachers.length} prédicateur(s) similaire(s) trouvé(s):\n`);
      
      let totalVideos = 0;
      similarPreachers.forEach((p, index) => {
        console.log(`   ${index + 1}. ID ${p.id}: "${p.name}"`);
        console.log(`      📹 ${p.video_count} vidéo(s)`);
        console.log(`      🔗 Slug: ${p.slug}\n`);
        totalVideos += parseInt(p.video_count);
      });
      
      console.log(`📊 TOTAL: ${totalVideos} vidéo(s) réparties entre ${similarPreachers.length} prédicateur(s)\n`);
      
      if (similarPreachers.length > 1) {
        console.log(`⚠️  PROBLÈME DÉTECTÉ: Les vidéos sont réparties entre plusieurs prédicateurs!`);
        console.log(`   Il y a probablement des doublons à fusionner.\n`);
        console.log(`💡 SOLUTION: Fusionner les doublons`);
        console.log(`   npm run clean-preachers:apply\n`);
      }
    }
    
    // 3. Chercher toutes les vidéos qui mentionnent le nom dans le titre
    console.log(`🔍 Recherche des vidéos mentionnant "${searchName}" dans les titres...\n`);
    
    const searchTerms = ['françois', 'francois', 'mudioko', 'mudiko'];
    const likeConditions = searchTerms.map(term => `LOWER(title) LIKE '%${term}%'`).join(' OR ');
    
    const [videosInTitles] = await db.execute(
      `SELECT COUNT(*) as total 
       FROM videos 
       WHERE ${likeConditions}`
    );
    
    const totalVideosInTitles = videosInTitles[0].total;
    console.log(`📹 ${totalVideosInTitles} vidéo(s) mentionnent "${searchName}" dans leur titre\n`);
    
    // 4. Compter les vidéos sans prédicateur qui mentionnent le nom
    const [videosWithoutPreacher] = await db.execute(
      `SELECT COUNT(*) as total 
       FROM videos 
       WHERE ${likeConditions} 
         AND preacher_id IS NULL`
    );
    
    const videosToAssign = videosWithoutPreacher[0].total;
    console.log(`⚠️  ${videosToAssign} vidéo(s) sans prédicateur mais mentionnant "${searchName}"\n`);
    
    // 5. Résumé et recommandations
    console.log(`═══════════════════════════════════════════════════════════\n`);
    console.log(`📊 RÉSUMÉ:\n`);
    
    if (exactPreacher.length > 0) {
      const [count] = await db.execute(
        'SELECT COUNT(*) as total FROM videos WHERE preacher_id = ?',
        [exactPreacher[0].id]
      );
      console.log(`   ✅ Prédicateur "${searchName}": ${count[0].total} vidéo(s) associée(s)`);
    }
    
    if (similarPreachers.length > 1) {
      console.log(`   ⚠️  ${similarPreachers.length} prédicateur(s) similaires trouvé(s) (DOUBLONS)`);
      console.log(`   📹 Total réparti: ${totalVideos} vidéo(s)`);
    }
    
    console.log(`   📹 Vidéos dans les titres: ${totalVideosInTitles}`);
    console.log(`   ⚠️  Vidéos à associer: ${videosToAssign}\n`);
    
    // Recommandations
    console.log(`💡 RECOMMANDATIONS:\n`);
    
    if (similarPreachers.length > 1) {
      console.log(`   1. Fusionner les doublons:`);
      console.log(`      npm run clean-preachers:apply\n`);
    }
    
    if (videosToAssign > 0) {
      console.log(`   2. Associer les ${videosToAssign} vidéo(s) sans prédicateur:`);
      console.log(`      node scripts/assignPreacherToVideos.js "${searchName}" "françois|mudioko|francois" --apply\n`);
    }
    
    if (exactPreacher.length > 0 && totalVideosInTitles > exactPreacher[0].video_count) {
      console.log(`   3. Vérifier pourquoi ${totalVideosInTitles - exactPreacher[0].video_count} vidéo(s) ne sont pas associées\n`);
    }
    
    console.log(`═══════════════════════════════════════════════════════════\n`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

diagnosePreacherVideos().then(() => {
  process.exit(0);
});

