import dotenv from 'dotenv';
import { createConnection } from '../config/database.js';
import { syncAutoPlaylists } from '../services/playlistService.js';

dotenv.config();

/**
 * Script pour synchroniser toutes les playlists automatiques
 * Usage: node scripts/syncPlaylists.js
 * 
 * Ce script crée ou met à jour les playlists pour :
 * - Tous les prédicateurs
 * - Tous les thèmes
 */
const syncPlaylists = async () => {
  try {
    console.log('🔄 Démarrage de la synchronisation des playlists...\n');
    
    await createConnection();
    
    const stats = await syncAutoPlaylists();
    
    console.log('\n📊 Statistiques de synchronisation:');
    console.log(`   ✅ ${stats.created} playlists créées`);
    console.log(`   🔄 ${stats.updated} playlists mises à jour`);
    console.log(`   ❌ ${stats.errors} erreurs`);
    console.log(`   📋 Total: ${stats.total} playlists`);
    
    console.log('\n✅ Synchronisation terminée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    process.exit(1);
  }
};

syncPlaylists();

