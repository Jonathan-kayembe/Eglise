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

  try {
    do {
      const response = await axios.get(`${YOUTUBE_API_BASE}/playlistItems`, {
        params: {
          part: 'snippet,contentDetails',
          playlistId: playlistId,
          maxResults: 50,
          pageToken: nextPageToken,
          key: YOUTUBE_API_KEY
        }
      });

      const videos = response.data.items.map(item => ({
        videoId: item.contentDetails.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
        publishedAt: item.snippet.publishedAt
      }));

      allVideos.push(...videos);
      nextPageToken = response.data.nextPageToken;

      // Délai pour respecter les limites de l'API
      if (nextPageToken) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } while (nextPageToken);

    return allVideos;
  } catch (error) {
    console.error('Erreur lors de la récupération des vidéos:', error.response?.data || error.message);
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

    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);
      const details = await getVideoDetails(batch);
      details.forEach(d => {
        detailsMap[d.videoId] = d;
      });
      await new Promise(resolve => setTimeout(resolve, 100));
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

