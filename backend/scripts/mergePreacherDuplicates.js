import dotenv from 'dotenv';
import { createConnection, getConnection } from '../config/database.js';
import { normalizeName } from '../utils/searchUtils.js';

dotenv.config();

/**
 * Script pour fusionner automatiquement les doublons de prédicateurs
 * Détecte les noms inversés, les variations, etc.
 * Usage: node scripts/mergePreacherDuplicates.js "François Mudioko"
 */
const mergePreacherDuplicates = async () => {
  try {
    await createConnection();
    const db = getConnection();
    
    const args = process.argv.slice(2);
    const targetName = args[0] || 'François Mudioko';
    const apply = args.includes('--apply');
    
    console.log(`🔍 Recherche des doublons pour "${targetName}"...\n`);
    
    // Normaliser le nom cible
    const targetNormalized = normalizeName(targetName);
    const targetWords = targetNormalized.split(' ').filter(w => w.length > 2);
    
    console.log(`📝 Nom normalisé: "${targetNormalized}"`);
    console.log(`📝 Mots clés: ${targetWords.join(', ')}\n`);
    
    // Chercher tous les prédicateurs qui contiennent les mêmes mots
    const [allPreachers] = await db.execute(
      'SELECT * FROM preachers ORDER BY name'
    );
    
    const duplicates = [];
    
    for (const preacher of allPreachers) {
      const preacherNormalized = normalizeName(preacher.name);
      const preacherWords = preacherNormalized.split(' ').filter(w => w.length > 2);
      
      // Vérifier si les mots correspondent (même si l'ordre est différent)
      const matchingWords = targetWords.filter(word => 
        preacherWords.some(pWord => pWord === word || pWord.includes(word) || word.includes(pWord))
      );
      
      // Si au moins 2 mots correspondent, c'est probablement le même prédicateur
      if (matchingWords.length >= 2 && preacher.name.toLowerCase() !== targetName.toLowerCase()) {
        const [count] = await db.execute(
          'SELECT COUNT(*) as total FROM videos WHERE preacher_id = ?',
          [preacher.id]
        );
        
        duplicates.push({
          id: preacher.id,
          name: preacher.name,
          normalized: preacherNormalized,
          videoCount: count[0].total,
          matchingWords: matchingWords.length
        });
      }
    }
    
    if (duplicates.length === 0) {
      console.log(`✅ Aucun doublon trouvé pour "${targetName}"\n`);
      process.exit(0);
    }
    
    // Trouver le prédicateur cible
    const [targetPreacher] = await db.execute(
      'SELECT * FROM preachers WHERE name = ?',
      [targetName]
    );
    
    if (targetPreacher.length === 0) {
      console.log(`❌ Prédicateur "${targetName}" non trouvé`);
      console.log(`\n💡 Créez-le d'abord: node scripts/addPreacher.js "${targetName}"\n`);
      process.exit(1);
    }
    
    const keeper = targetPreacher[0];
    const [keeperCount] = await db.execute(
      'SELECT COUNT(*) as total FROM videos WHERE preacher_id = ?',
      [keeper.id]
    );
    
    console.log(`✅ Prédicateur principal: "${keeper.name}" (ID ${keeper.id})`);
    console.log(`   📹 ${keeperCount[0].total} vidéo(s) actuelle(s)\n`);
    
    console.log(`📋 Doublons trouvés (${duplicates.length}):\n`);
    
    duplicates.forEach((dup, index) => {
      console.log(`   ${index + 1}. ID ${dup.id}: "${dup.name}"`);
      console.log(`      📹 ${dup.videoCount} vidéo(s)`);
      console.log(`      🔗 Correspondance: ${dup.matchingWords} mot(s) commun(s)`);
      console.log(`      📝 Normalisé: "${dup.normalized}"\n`);
    });
    
    const totalVideosToMerge = duplicates.reduce((sum, dup) => sum + dup.videoCount, 0);
    const finalVideoCount = keeperCount[0].total + totalVideosToMerge;
    
    console.log(`📊 RÉSUMÉ:`);
    console.log(`   📹 Vidéos actuelles: ${keeperCount[0].total}`);
    console.log(`   📹 Vidéos à fusionner: ${totalVideosToMerge}`);
    console.log(`   📹 Total après fusion: ${finalVideoCount}\n`);
    
    if (!apply) {
      console.log(`💡 Mode DRY RUN - Aucune modification effectuée`);
      console.log(`💡 Pour appliquer la fusion: node scripts/mergePreacherDuplicates.js "${targetName}" --apply\n`);
      process.exit(0);
    }
    
    // Fusionner les doublons
    console.log(`🔄 Fusion des doublons...\n`);
    
    for (const dup of duplicates) {
      console.log(`   🔄 Fusion de "${dup.name}" (ID ${dup.id}) vers "${keeper.name}"...`);
      
      // Mettre à jour les vidéos
      const [updateResult] = await db.execute(
        'UPDATE videos SET preacher_id = ? WHERE preacher_id = ?',
        [keeper.id, dup.id]
      );
      
      console.log(`      ✅ ${updateResult.affectedRows} vidéo(s) transférée(s)`);
      
      // Supprimer le doublon
      await db.execute('DELETE FROM preachers WHERE id = ?', [dup.id]);
      console.log(`      ✅ Prédicateur supprimé\n`);
    }
    
    // Vérifier le résultat final
    const [finalCount] = await db.execute(
      'SELECT COUNT(*) as total FROM videos WHERE preacher_id = ?',
      [keeper.id]
    );
    
    console.log(`═══════════════════════════════════════════════════════════\n`);
    console.log(`✅ Fusion terminée avec succès!`);
    console.log(`   📹 "${keeper.name}" a maintenant ${finalCount[0].total} vidéo(s)\n`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

mergePreacherDuplicates().then(() => {
  process.exit(0);
});

