import dotenv from 'dotenv';
import { createConnection, getConnection } from '../config/database.js';

dotenv.config();

/**
 * Script pour corriger manuellement un nom de prédicateur
 * Usage: node scripts/fixPreacherName.js "Ancien Nom" "Nouveau Nom"
 */
const fixPreacherName = async () => {
  try {
    await createConnection();
    const db = getConnection();
    
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('❌ Usage: node scripts/fixPreacherName.js "Ancien Nom" "Nouveau Nom"');
      console.log('   Exemple: node scripts/fixPreacherName.js "Josué" "Josué Kadima"');
      process.exit(1);
    }
    
    const oldName = args[0];
    const newName = args[1];
    
    console.log(`🔍 Recherche du prédicateur "${oldName}"...\n`);
    
    // Chercher le prédicateur
    const [preachers] = await db.execute(
      'SELECT * FROM preachers WHERE name = ? OR name LIKE ?',
      [oldName, `%${oldName}%`]
    );
    
    if (preachers.length === 0) {
      console.log(`❌ Aucun prédicateur trouvé avec le nom "${oldName}"`);
      process.exit(1);
    }
    
    if (preachers.length > 1) {
      console.log(`⚠️  ${preachers.length} prédicateur(s) trouvé(s) avec ce nom:`);
      for (const p of preachers) {
        const [count] = await db.execute(
          'SELECT COUNT(*) as total FROM videos WHERE preacher_id = ?',
          [p.id]
        );
        console.log(`   - ID ${p.id}: "${p.name}" (${count[0].total} vidéos)`);
      }
      console.log('\n💡 Spécifiez un nom plus précis ou utilisez l\'ID');
      process.exit(1);
    }
    
    const preacher = preachers[0];
    const [count] = await db.execute(
      'SELECT COUNT(*) as total FROM videos WHERE preacher_id = ?',
      [preacher.id]
    );
    
    console.log(`📋 Prédicateur trouvé:`);
    console.log(`   ID: ${preacher.id}`);
    console.log(`   Nom actuel: "${preacher.name}"`);
    console.log(`   Nombre de vidéos: ${count[0].total}`);
    console.log(`\n✏️  Nouveau nom: "${newName}"`);
    
    // Générer le nouveau slug
    const newSlug = newName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    console.log(`   Nouveau slug: "${newSlug}"\n`);
    
    // Vérifier si le nouveau nom existe déjà
    const [existing] = await db.execute(
      'SELECT * FROM preachers WHERE name = ? AND id != ?',
      [newName, preacher.id]
    );
    
    if (existing.length > 0) {
      console.log(`⚠️  ATTENTION: Un prédicateur avec le nom "${newName}" existe déjà (ID ${existing[0].id})`);
      console.log('💡 Utilisez le script clean-preachers pour fusionner les doublons\n');
      process.exit(1);
    }
    
    // Vérifier si le nouveau slug existe déjà
    const [existingSlug] = await db.execute(
      'SELECT * FROM preachers WHERE slug = ? AND id != ?',
      [newSlug, preacher.id]
    );
    
    if (existingSlug.length > 0) {
      console.log(`⚠️  Le slug "${newSlug}" existe déjà. Utilisation d'un slug unique...`);
      const uniqueSlug = `${newSlug}-${preacher.id}`;
      console.log(`   Nouveau slug: "${uniqueSlug}"\n`);
      
      // Mettre à jour
      await db.execute(
        'UPDATE preachers SET name = ?, slug = ? WHERE id = ?',
        [newName, uniqueSlug, preacher.id]
      );
    } else {
      // Mettre à jour
      await db.execute(
        'UPDATE preachers SET name = ?, slug = ? WHERE id = ?',
        [newName, newSlug, preacher.id]
      );
    }
    
    console.log('✅ Nom du prédicateur mis à jour avec succès!\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

fixPreacherName().then(() => {
  process.exit(0);
});

