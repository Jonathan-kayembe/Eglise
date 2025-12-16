import client from './client.js';

/**
 * Récupère la vidéo en direct actuelle
 * @returns {Promise<{live: Object|null}>}
 */
export const getLiveVideo = async () => {
  try {
    const response = await client.get('/youtube/live');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération du live:', error);
    return { live: null };
  }
};

