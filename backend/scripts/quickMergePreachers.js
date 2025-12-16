import dotenv from 'dotenv';
import { createConnection, getConnection } from '../config/database.js';

dotenv.config();

/**
 * Script rapide pour fusionner deux prédicateurs spécifiques
 * Usage: node scripts/quickMergePreachers.js "Nom à garder" "Nom à fusionner"
 */
const quickMergePreachers = async () => {
  try {
    await createConnection();
    const db = getConnection();
    
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('❌ Usage: node scripts/quickMergePreachers.js "Nom à garder" "Nom à fusionner"');
      console.log('   Exemple: node scripts/quickMergePreachers.js "François Mudioko" "Mudioko Fran"');
      process.exit(1);
    }
    
    const keeperName = args[0];
    const toMergeName = args[1];
    const apply = args.includes('--apply');
    
    console.log(`🔍 Recherche des prédicateurs...\n`);
    
    // Trouver le prédicateur à garder
    const [keeperPreachers] = await db.execute(
      'SELECT * FROM preachers WHERE name = ? OR name LIKE ?',
      [keeperName, `%${keeperName}%`]
    );
    
    if (keeperPreachers.length === 0) {
      console.log(`❌ Prédicateur "${keeperName}" non trouvé`);
      console.log(`\n💡 Créez-le d'abord: node scripts/addPreacher.js "${keeperName}"\n`);
      process.exit(1);
    }
    
    if (keeperPreachers.length > 1) {
      console.log(`⚠️  ${keeperPreachers.length} prédicateur(s) trouvé(s) pour "${keeperName}":`);
      keeperPreachers.forEach(p => {
        console.log(`   - ID ${p.id}: "${p.name}"`);
      });
      console.log(`\n💡 Spécifiez un nom plus précis\n`);
      process.exit(1);
    }
    
    const keeper = keeperPreachers[0];
    
    // Trouver le prédicateur à fusionner
    const [toMergePreachers] = await db.execute(
      'SELECT * FROM preachers WHERE name = ? OR name LIKE ?',
      [toMergeName, `%${toMergeName}%`]
    );
    
    if (toMergePreachers.length === 0) {
      console.log(`❌ Prédicateur "${toMergeName}" non trouvé\n`);
      process.exit(1);
    }
    
    if (toMergePreachers.length > 1) {
      console.log(`⚠️  ${toMergePreachers.length} prédicateur(s) trouvé(s) pour "${toMergeName}":`);
      toMergePreachers.forEach(p => {
        console.log(`   - ID ${p.id}: "${p.name}"`);
      });
      console.log(`\n💡 Spécifiez un nom plus précis\n`);
      process.exit(1);
    }
    
    const toMerge = toMergePreachers[0];
    
    // Compter les vidéos
    const [keeperCount] = await db.execute(
      'SELECT COUNT(*) as total FROM videos WHERE preacher_id = ?',
      [keeper.id]
    );
    
    const [toMergeCount] = await db.execute(
      'SELECT COUNT(*) as total FROM videos WHERE preacher_id = ?',
      [toMerge.id]
    );
    
    console.log(`📋 PRÉDICATEURS TROUVÉS:\n`);
    console.log(`   ✅ À garder: "${keeper.name}" (ID ${keeper.id})`);
    console.log(`      📹 ${keeperCount[0].total} vidéo(s) actuelle(s)`);
    console.log(`\n   🔄 À fusionner: "${toMerge.name}" (ID ${toMerge.id})`);
    console.log(`      📹 ${toMergeCount[0].total} vidéo(s) à transférer\n`);
    
    const finalCount = keeperCount[0].total + toMergeCount[0].total;
    
    console.log(`📊 RÉSULTAT APRÈS FUSION:`);
    console.log(`   📹 "${keeper.name}" aura ${finalCount} vidéo(s) au total\n`);
    
    if (!apply) {
      console.log(`💡 Mode DRY RUN - Aucune modification effectuée`);
      console.log(`💡 Pour appliquer la fusion: node scripts/quickMergePreachers.js "${keeperName}" "${toMergeName}" --apply\n`);
      process.exit(0);
    }
    
    // Fusionner
    console.log(`🔄 Fusion en cours...\n`);
    
    // Mettre à jour les vidéos
    const [updateResult] = await db.execute(
      'UPDATE videos SET preacher_id = ? WHERE preacher_id = ?',
      [keeper.id, toMerge.id]
    );
    
    console.log(`   ✅ ${updateResult.affectedRows} vidéo(s) transférée(s) vers "${keeper.name}"`);
    
    // Supprimer le doublon
    await db.execute('DELETE FROM preachers WHERE id = ?', [toMerge.id]);
    console.log(`   ✅ Prédicateur "${toMerge.name}" supprimé\n`);
    
    // Vérifier le résultat
    const [finalCountResult] = await db.execute(
      'SELECT COUNT(*) as total FROM videos WHERE preacher_id = ?',
      [keeper.id]
    );
    
    console.log(`═══════════════════════════════════════════════════════════\n`);
    console.log(`✅ Fusion terminée avec succès!`);
    console.log(`   📹 "${keeper.name}" a maintenant ${finalCountResult[0].total} vidéo(s)\n`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

quickMergePreachers().then(() => {
  process.exit(0);
});

