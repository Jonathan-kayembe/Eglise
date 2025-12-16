import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const addPlaylistsTable = async () => {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'eglise_predications'
    });

    console.log('📦 Ajout de la table playlists...');

    // Table playlists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS playlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        thumbnail VARCHAR(500),
        type ENUM('preacher', 'theme', 'custom') DEFAULT 'custom',
        reference_id INT NULL COMMENT 'ID du prédicateur ou thème si type est preacher ou theme',
        is_featured BOOLEAN DEFAULT FALSE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slug (slug),
        INDEX idx_type (type),
        INDEX idx_featured (is_featured),
        INDEX idx_sort (sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table playlists créée');

    // Table de liaison playlist_videos
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS playlist_videos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        playlist_id INT NOT NULL,
        video_id INT NOT NULL,
        position INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
        UNIQUE KEY unique_playlist_video (playlist_id, video_id),
        INDEX idx_playlist (playlist_id),
        INDEX idx_video (video_id),
        INDEX idx_position (position)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table playlist_videos créée');

    console.log('\n🎉 Tables playlists ajoutées avec succès!');
    console.log('\n💡 Vous pouvez maintenant créer des playlists via l\'API ou manuellement en base de données.\n');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des tables:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

addPlaylistsTable();

