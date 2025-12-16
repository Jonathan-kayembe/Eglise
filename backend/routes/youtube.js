import express from 'express';
import { getLiveVideo } from '../services/youtubeService.js';

const router = express.Router();

// Cache pour éviter le spam API
let liveCache = {
  data: null,
  timestamp: null
};

const CACHE_DURATION = 45 * 1000; // 45 secondes

/**
 * GET /api/youtube/live
 * Récupère la vidéo en direct actuelle de la chaîne YouTube
 * Retourne null si aucun live n'est en cours
 * Utilise un cache de 45 secondes pour éviter le spam API
 */
router.get('/live', async (req, res, next) => {
  try {
    const now = Date.now();
    
    // Vérifier si le cache est encore valide
    if (liveCache.data !== undefined && liveCache.timestamp && (now - liveCache.timestamp) < CACHE_DURATION) {
      console.log('📦 Utilisation du cache pour le live');
      return res.json({ live: liveCache.data });
    }
    
    // Récupérer le live depuis l'API YouTube
    console.log('🔴 Vérification du live YouTube...');
    const liveVideo = await getLiveVideo();
    
    // Mettre à jour le cache
    liveCache = {
      data: liveVideo,
      timestamp: now
    };
    
    if (liveVideo) {
      console.log(`✅ Live trouvé: ${liveVideo.title}`);
    } else {
      console.log('ℹ️  Aucun live en cours');
    }
    
    res.json({ live: liveVideo });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du live:', error);
    // En cas d'erreur, retourner null plutôt que de faire planter l'application
    res.json({ live: null });
  }
});

export default router;

