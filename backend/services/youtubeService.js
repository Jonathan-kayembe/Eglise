import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Récupère l'ID de la playlist "uploads" d'une chaîne YouTube
 * Supporte les IDs de chaîne (UC...) et les handles (@username)
 */
export const getChannelUploadsPlaylistId = async (channelIdentifier) => {
  try {
    // Détecter si c'est un handle (commence par @) ou un ID de chaîne
    const isHandle = channelIdentifier.startsWith('@');
    const params = {
      part: 'contentDetails',
      key: YOUTUBE_API_KEY
    };

    if (isHandle) {
      // Utiliser forHandle pour les nouveaux handles YouTube
      params.forHandle = channelIdentifier;
    } else if (channelIdentifier.startsWith('UC')) {
      // ID de chaîne classique
      params.id = channelIdentifier;
    } else {
      // Essayer avec forUsername (ancien format)
      params.forUsername = channelIdentifier.replace('@', '');
    }

    const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, { params });

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].contentDetails.relatedPlaylists.uploads;
    }
    throw new Error('Chaîne YouTube non trouvée');
  } catch (error) {
    console.error('Erreur lors de la récupération de la playlist:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Récupère toutes les vidéos d'une playlist avec pagination
 */
export const getAllPlaylistVideos = async (playlistId) => {
  const allVideos = [];
  let nextPageToken = null;
  let pageCount = 0;
  let totalRetrieved = 0;

  try {
    do {
      pageCount++;
      console.log(`📄 Récupération page ${pageCount}... (${totalRetrieved} vidéos déjà récupérées)`);
      
      const response = await axios.get(`${YOUTUBE_API_BASE}/playlistItems`, {
        params: {
          part: 'snippet,contentDetails',
          playlistId: playlistId,
          maxResults: 50, // Maximum autorisé par l'API
          pageToken: nextPageToken || undefined, // Ne pas envoyer null
          key: YOUTUBE_API_KEY
        }
      });

      // Vérifier si la réponse est valide
      if (!response.data || !response.data.items) {
        console.warn(`⚠️  Réponse invalide pour la page ${pageCount}`);
        break;
      }

      const items = response.data.items || [];
      console.log(`   ✅ ${items.length} vidéos trouvées sur cette page`);

      // Filtrer les vidéos supprimées ou privées
      const validVideos = items
        .filter(item => {
          // Vérifier si la vidéo n'est pas supprimée
          if (item.snippet.title === 'Deleted video' || item.snippet.title === 'Private video') {
            return false;
          }
          // Vérifier si contentDetails existe
          if (!item.contentDetails || !item.contentDetails.videoId) {
            return false;
          }
          return true;
        })
        .map(item => ({
          videoId: item.contentDetails.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
          publishedAt: item.snippet.publishedAt
        }));

      allVideos.push(...validVideos);
      totalRetrieved = allVideos.length;
      nextPageToken = response.data.nextPageToken;

      // Afficher le progrès
      if (nextPageToken) {
        console.log(`   📊 Total accumulé: ${totalRetrieved} vidéos. Page suivante disponible.`);
        // Délai pour respecter les limites de l'API (augmenté pour éviter les erreurs de quota)
        await new Promise(resolve => setTimeout(resolve, 200));
      } else {
        console.log(`   ✅ Dernière page atteinte. Total final: ${totalRetrieved} vidéos.`);
      }

      // Protection contre les boucles infinies (sécurité)
      if (pageCount > 1000) {
        console.warn('⚠️  Limite de sécurité atteinte (1000 pages). Arrêt de la récupération.');
        break;
      }

    } while (nextPageToken);

    console.log(`\n📊 Récupération terminée: ${totalRetrieved} vidéos sur ${pageCount} pages\n`);
    return allVideos;
  } catch (error) {
    console.error('\n❌ Erreur lors de la récupération des vidéos:');
    console.error('   Message:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
      
      // Gestion spécifique des erreurs de quota
      if (error.response.status === 403) {
        const errorData = error.response.data?.error;
        if (errorData?.errors?.[0]?.reason === 'quotaExceeded') {
          console.error('\n⚠️  QUOTA API YOUTUBE DÉPASSÉ!');
          console.error('   Vous avez atteint la limite quotidienne de requêtes.');
          console.error('   Solutions:');
          console.error('   1. Attendre 24h pour le reset du quota');
          console.error('   2. Demander une augmentation de quota sur Google Cloud Console');
          console.error('   3. Utiliser plusieurs clés API et alterner entre elles');
        } else if (errorData?.errors?.[0]?.reason === 'forbidden') {
          console.error('\n⚠️  ACCÈS REFUSÉ!');
          console.error('   Vérifiez que votre clé API est valide et a les bonnes permissions.');
        }
      }
    }
    
    // Retourner les vidéos récupérées jusqu'à présent plutôt que de tout perdre
    if (allVideos.length > 0) {
      console.log(`\n⚠️  Retour de ${allVideos.length} vidéos récupérées avant l'erreur.`);
      return allVideos;
    }
    
    throw error;
  }
};

/**
 * Récupère les détails complets d'une vidéo (durée, vues, etc.)
 */
export const getVideoDetails = async (videoIds) => {
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        part: 'contentDetails,statistics',
        id: videoIds.join(','),
        key: YOUTUBE_API_KEY
      }
    });

    return response.data.items.map(item => ({
      videoId: item.id,
      duration: parseDuration(item.contentDetails.duration),
      viewCount: parseInt(item.statistics.viewCount || 0)
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des détails:', error.response?.data || error.message);
    return [];
  }
};

/**
 * Parse la durée ISO 8601 en secondes
 */
const parseDuration = (duration) => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;

  const hours = (match[1] || '').replace('H', '') || 0;
  const minutes = (match[2] || '').replace('M', '') || 0;
  const seconds = (match[3] || '').replace('S', '') || 0;

  return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
};

/**
 * Récupère toutes les vidéos de la chaîne
 */
export const fetchAllChannelVideos = async () => {
  try {
    console.log('📺 Récupération de la playlist uploads...');
    const playlistId = await getChannelUploadsPlaylistId(YOUTUBE_CHANNEL_ID);
    console.log(`✅ Playlist trouvée: ${playlistId}`);

    console.log('📥 Récupération de toutes les vidéos...');
    const videos = await getAllPlaylistVideos(playlistId);
    console.log(`✅ ${videos.length} vidéos récupérées`);

    // Récupérer les détails par lots de 50 (limite de l'API)
    console.log('📊 Récupération des détails des vidéos...');
    const videoIds = videos.map(v => v.videoId);
    const detailsMap = {};
    const totalBatches = Math.ceil(videoIds.length / 50);

    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);
      const batchNumber = Math.floor(i / 50) + 1;
      console.log(`   📦 Lot ${batchNumber}/${totalBatches} (${batch.length} vidéos)...`);
      
      try {
        const details = await getVideoDetails(batch);
        details.forEach(d => {
          detailsMap[d.videoId] = d;
        });
        console.log(`   ✅ ${details.length} détails récupérés`);
      } catch (error) {
        console.error(`   ⚠️  Erreur pour le lot ${batchNumber}:`, error.message);
        // Continuer avec les autres lots même en cas d'erreur
      }
      
      // Délai augmenté pour éviter les erreurs de quota
      if (i + 50 < videoIds.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Fusionner les données
    const completeVideos = videos.map(video => ({
      ...video,
      duration: detailsMap[video.videoId]?.duration || 0,
      viewCount: detailsMap[video.videoId]?.viewCount || 0
    }));

    return completeVideos;
  } catch (error) {
    console.error('Erreur lors de la récupération des vidéos de la chaîne:', error);
    throw error;
  }
};

