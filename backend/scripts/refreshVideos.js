import dotenv from 'dotenv';
import { fetchAllChannelVideos } from '../services/youtubeService.js';
import { upsertVideo } from '../services/videoService.js';
import { createConnection } from '../config/database.js';

dotenv.config();

const refreshVideos = async () => {
  try {
    console.log('🔄 Démarrage de la synchronisation des vidéos YouTube...\n');

    // Initialiser la connexion DB
    await createConnection();

    // Récupérer toutes les vidéos de YouTube
    const youtubeVideos = await fetchAllChannelVideos();
    console.log(`\n📥 ${youtubeVideos.length} vidéos récupérées de YouTube\n`);

    // Insérer ou mettre à jour dans la base de données
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < youtubeVideos.length; i++) {
      const video = youtubeVideos[i];
      
      try {
        // Extraire les tags depuis la description (optionnel)
        const tags = extractTags(video.description || '');

        await upsertVideo({
          youtubeId: video.videoId,
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnail,
          publishedAt: new Date(video.publishedAt),
          tags: tags,
          duration: video.duration,
          viewCount: video.viewCount,
          preacherId: null, // À associer manuellement ou via un système de détection
          themeId: null // À associer manuellement ou via un système de détection
        });

        // Vérifier si c'était une création ou mise à jour
        // (on pourrait améliorer ça en retournant un flag depuis upsertVideo)
        created++;
        
        if ((i + 1) % 10 === 0) {
          console.log(`✅ Traité ${i + 1}/${youtubeVideos.length} vidéos...`);
        }
      } catch (error) {
        console.error(`❌ Erreur pour la vidéo ${video.videoId}:`, error.message);
        errors++;
      }
    }

    console.log('\n🎉 Synchronisation terminée!');
    console.log(`✅ ${created} vidéos synchronisées`);
    if (errors > 0) {
      console.log(`⚠️  ${errors} erreurs`);
    }
    console.log('\n💡 Astuce: Utilisez l\'interface admin pour associer les vidéos aux prédicateurs et thèmes.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
};

/**
 * Extrait les tags depuis la description (exemple simple)
 */
const extractTags = (description) => {
  // Exemple: chercher des hashtags ou mots-clés
  const hashtags = description.match(/#[\w]+/g) || [];
  return hashtags.map(tag => tag.substring(1).toLowerCase());
};

refreshVideos();

