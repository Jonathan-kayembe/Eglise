import dotenv from 'dotenv';
import { createConnection, getConnection } from '../config/database.js';

dotenv.config();

/**
 * Script pour associer manuellement un prédicateur à des vidéos basé sur une recherche dans les titres
 * Usage: node scripts/assignPreacherToVideos.js "François Mudioko" "François|Mudioko|Francois"
 */
const assignPreacherToVideos = async () => {
  try {
    await createConnection();
    const db = getConnection();
    
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
      console.log('❌ Usage: node scripts/assignPreacherToVideos.js "Nom du Prédicateur" [pattern de recherche]');
      console.log('   Exemple: node scripts/assignPreacherToVideos.js "François Mudioko" "François|Mudioko|Francois"');
      process.exit(1);
    }
    
    const preacherName = args[0];
    const searchPattern = args[1] || preacherName.split(' ').join('|');
    
    console.log(`🔍 Recherche du prédicateur "${preacherName}"...\n`);
    
    // Trouver le prédicateur
    const [preachers] = await db.execute(
      'SELECT * FROM preachers WHERE name = ? OR name LIKE ?',
      [preacherName, `%${preacherName}%`]
    );
    
    if (preachers.length === 0) {
      console.log(`❌ Prédicateur "${preacherName}" non trouvé`);
      console.log(`\n💡 Créez-le d'abord: node scripts/addPreacher.js "${preacherName}"\n`);
      process.exit(1);
    }
    
    if (preachers.length > 1) {
      console.log(`⚠️  ${preachers.length} prédicateur(s) trouvé(s):`);
      preachers.forEach(p => console.log(`   - ID ${p.id}: "${p.name}"`));
      console.log(`\n💡 Spécifiez un nom plus précis\n`);
      process.exit(1);
    }
    
    const preacher = preachers[0];
    console.log(`✅ Prédicateur trouvé: "${preacher.name}" (ID ${preacher.id})\n`);
    
    // Rechercher les vidéos qui correspondent au pattern
    console.log(`🔍 Recherche des vidéos avec le pattern: "${searchPattern}"\n`);
    
    const [videos] = await db.execute(
      `SELECT id, title, preacher_id 
       FROM videos 
       WHERE (LOWER(title) REGEXP ? OR LOWER(title) LIKE ?)
         AND (preacher_id IS NULL OR preacher_id != ?)
       ORDER BY published_at DESC`,
      [
        searchPattern.toLowerCase(),
        `%${preacherName.toLowerCase()}%`,
        preacher.id
      ]
    );
    
    if (videos.length === 0) {
      console.log(`❌ Aucune vidéo trouvée correspondant au pattern "${searchPattern}"`);
      console.log(`\n💡 Essayez un pattern différent ou vérifiez les titres de vidéos\n`);
      process.exit(0);
    }
    
    console.log(`📹 ${videos.length} vidéo(s) trouvée(s):\n`);
    
    // Afficher les premières vidéos
    videos.slice(0, 10).forEach((video, index) => {
      const status = video.preacher_id ? '⚠️  (déjà associée)' : '✅';
      console.log(`${status} ${index + 1}. [ID ${video.id}] ${video.title.substring(0, 70)}${video.title.length > 70 ? '...' : ''}`);
    });
    
    if (videos.length > 10) {
      console.log(`\n   ... et ${videos.length - 10} autre(s) vidéo(s)`);
    }
    
    const toAssign = videos.filter(v => !v.preacher_id);
    const alreadyAssigned = videos.filter(v => v.preacher_id);
    
    console.log(`\n📊 Résumé:`);
    console.log(`   ✅ ${toAssign.length} vidéo(s) à associer`);
    if (alreadyAssigned.length > 0) {
      console.log(`   ⚠️  ${alreadyAssigned.length} vidéo(s) déjà associée(s) à un autre prédicateur`);
    }
    
    if (toAssign.length === 0) {
      console.log(`\n✅ Toutes les vidéos sont déjà associées!\n`);
      process.exit(0);
    }
    
    // Demander confirmation (en mode non-interactif, on applique directement)
    console.log(`\n💡 Pour appliquer l'association, relancez avec --apply:`);
    console.log(`   node scripts/assignPreacherToVideos.js "${preacherName}" "${searchPattern}" --apply\n`);
    
    // Si --apply est présent, appliquer
    if (args.includes('--apply')) {
      console.log(`🔄 Association des vidéos...\n`);
      
      for (const video of toAssign) {
        await db.execute(
          'UPDATE videos SET preacher_id = ? WHERE id = ?',
          [preacher.id, video.id]
        );
        console.log(`   ✅ [ID ${video.id}] "${video.title.substring(0, 50)}..."`);
      }
      
      console.log(`\n✅ ${toAssign.length} vidéo(s) associée(s) avec succès!\n`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

assignPreacherToVideos().then(() => {
  process.exit(0);
});

