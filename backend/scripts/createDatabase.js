import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const createDatabase = async () => {
  let connection;
  
  try {
    // Se connecter sans spécifier de base de données
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root'
    };

    // Ajouter le mot de passe seulement s'il est défini et non vide
    if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim() !== '' && process.env.DB_PASSWORD !== 'your_password') {
      config.password = process.env.DB_PASSWORD;
    }

    connection = await mysql.createConnection(config);

    const dbName = process.env.DB_NAME || 'eglise_predications';

    console.log(`📦 Création de la base de données "${dbName}"...`);

    // Créer la base de données si elle n'existe pas
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );

    console.log(`✅ Base de données "${dbName}" créée avec succès!`);
    console.log('\n💡 Vous pouvez maintenant exécuter: npm run migrate');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la base de données:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  MySQL n\'est pas démarré ou n\'est pas accessible.');
      console.error('   Assurez-vous que MySQL est en cours d\'exécution.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n⚠️  Erreur d\'authentification MySQL.');
      console.error('   Vérifiez vos identifiants dans le fichier .env');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

createDatabase();

