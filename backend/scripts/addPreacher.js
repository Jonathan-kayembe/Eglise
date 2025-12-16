import dotenv from 'dotenv';
import { createConnection, getConnection } from '../config/database.js';

dotenv.config();

/**
 * Script pour ajouter un prédicateur manuellement
 * Usage: node scripts/addPreacher.js "Nom du Prédicateur"
 */
const addPreacher = async () => {
  try {
    await createConnection();
    const db = getConnection();
    
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
      console.log('❌ Usage: node scripts/addPreacher.js "Nom du Prédicateur"');
      console.log('   Exemple: node scripts/addPreacher.js "François Mudioko"');
      process.exit(1);
    }
    
    const preacherName = args.join(' '); // Permet les noms avec espaces
    
    console.log(`🔍 Vérification du prédicateur "${preacherName}"...\n`);
    
    // Vérifier si le prédicateur existe déjà
    const [existing] = await db.execute(
      'SELECT * FROM preachers WHERE name = ? OR name LIKE ?',
      [preacherName, `%${preacherName}%`]
    );
    
    if (existing.length > 0) {
      console.log(`✅ Le prédicateur existe déjà:`);
      for (const p of existing) {
        const [count] = await db.execute(
          'SELECT COUNT(*) as total FROM videos WHERE preacher_id = ?',
          [p.id]
        );
        console.log(`   - ID ${p.id}: "${p.name}" (${count[0].total} vidéos)`);
      }
      console.log('\n💡 Si vous voulez modifier le nom, utilisez: node scripts/fixPreacherName.js\n');
      process.exit(0);
    }
    
    // Générer le slug
    const slug = preacherName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // Vérifier si le slug existe déjà
    const [existingSlug] = await db.execute(
      'SELECT * FROM preachers WHERE slug = ?',
      [slug]
    );
    
    let finalSlug = slug;
    if (existingSlug.length > 0) {
      console.log(`⚠️  Le slug "${slug}" existe déjà.`);
      // Générer un slug unique avec timestamp
      finalSlug = `${slug}-${Date.now()}`;
      console.log(`   Utilisation du slug: "${finalSlug}"\n`);
    }
    
    // Créer le prédicateur
    const [result] = await db.execute(
      'INSERT INTO preachers (name, slug) VALUES (?, ?)',
      [preacherName, finalSlug]
    );
    
    console.log(`✅ Prédicateur créé avec succès!`);
    console.log(`   ID: ${result.insertId}`);
    console.log(`   Nom: "${preacherName}"`);
    console.log(`   Slug: "${finalSlug}"`);
    console.log(`\n💡 Pour associer des vidéos à ce prédicateur:`);
    console.log(`   - Utilisez: npm run auto-assign-preachers:apply`);
    console.log(`   - Ou mettez à jour manuellement les vidéos dans la base de données\n`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

addPreacher().then(() => {
  process.exit(0);
});

