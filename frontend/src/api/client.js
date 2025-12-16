import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const client = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes de timeout
});

// Intercepteur pour les erreurs avec retry automatique pour les erreurs 429
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si c'est une erreur 429 et qu'on n'a pas encore retenté
    if (error.response?.status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Récupérer le temps d'attente depuis les headers ou utiliser une valeur par défaut
      const retryAfter = error.response?.headers?.['retry-after'] || 
                        error.response?.data?.retryAfter || 
                        60; // 60 secondes par défaut
      
      // Attendre avant de réessayer (avec un maximum de 5 minutes)
      const waitTime = Math.min(parseInt(retryAfter) * 1000, 5 * 60 * 1000);
      
      console.warn(`Rate limit atteint. Nouvelle tentative dans ${waitTime / 1000} secondes...`);
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Réessayer la requête
      return client(originalRequest);
    }

    // Gestion des erreurs réseau et timeout
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      console.error('Erreur réseau ou timeout:', error);
      error.message = 'La connexion au serveur a échoué ou a pris trop de temps. Vérifiez que le backend est démarré.';
    } else if (!error.response) {
      console.error('Erreur réseau:', error);
      error.message = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur ' + API_URL;
    } else {
      console.error('API Error:', error);
    }
    
    return Promise.reject(error);
  }
);

export default client;

