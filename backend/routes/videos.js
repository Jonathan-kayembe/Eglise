import express from 'express';
import { query, param } from 'express-validator';
import { getVideos, getVideoById, getSuggestedVideos, getVideoByYoutubeId, upsertVideo } from '../services/videoService.js';
import { validateRequest } from '../middleware/validation.js';
import { fetchAllChannelVideos } from '../services/youtubeService.js';

const router = express.Router();

/**
 * GET /api/videos
 * Liste des vidéos avec pagination et filtres
 */
router.get(
  '/',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('preacher').optional().isInt().toInt(),
    query('theme').optional().isInt().toInt(),
    query('q').optional().isString().trim(),
    query('sort').optional().isIn(['asc', 'desc'])
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const result = await getVideos({
        limit: req.query.limit,
        page: req.query.page,
        preacherId: req.query.preacher,
        themeId: req.query.theme,
        q: req.query.q,
        sort: req.query.sort || 'desc'
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/videos/:id
 * Détails d'une vidéo
 */
router.get(
  '/:id',
  [param('id').isInt().toInt()],
  validateRequest,
  async (req, res, next) => {
    try {
      const video = await getVideoById(req.params.id);
      
      if (!video) {
        return res.status(404).json({ error: 'Vidéo non trouvée' });
      }

      res.json(video);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/videos/:id/suggested
 * Vidéos suggérées
 */
router.get(
  '/:id/suggested',
  [param('id').isInt().toInt()],
  validateRequest,
  async (req, res, next) => {
    try {
      const videos = await getSuggestedVideos(req.params.id, 6);
      res.json({ videos });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/videos/sync
 * Synchroniser les vidéos depuis YouTube
 */
router.post(
  '/sync',
  async (req, res, next) => {
    try {
      console.log('🔄 Démarrage de la synchronisation des vidéos YouTube...');
      
      // Récupérer toutes les vidéos de YouTube
      const youtubeVideos = await fetchAllChannelVideos();
      console.log(`📥 ${youtubeVideos.length} vidéos récupérées de YouTube`);

      // Fonction pour extraire les tags
      const extractTags = (description) => {
        if (!description) return [];
        const hashtags = description.match(/#[\w]+/g) || [];
        return hashtags.map(tag => tag.substring(1).toLowerCase());
      };

      // Insérer ou mettre à jour dans la base de données
      let created = 0;
      let updated = 0;
      let errors = 0;

      for (let i = 0; i < youtubeVideos.length; i++) {
        const video = youtubeVideos[i];
        
        try {
          // Vérifier si la vidéo existe déjà
          const existing = await getVideoByYoutubeId(video.videoId);
          const wasNew = !existing;

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
            preacherId: null,
            themeId: null
          });

          if (wasNew) {
            created++;
          } else {
            updated++;
          }
        } catch (error) {
          console.error(`❌ Erreur pour la vidéo ${video.videoId}:`, error.message);
          errors++;
        }
      }

      res.json({
        success: true,
        message: 'Synchronisation terminée',
        stats: {
          total: youtubeVideos.length,
          created,
          updated,
          errors
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      next(error);
    }
  }
);

export default router;

