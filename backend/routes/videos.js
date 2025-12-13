import express from 'express';
import { query, param } from 'express-validator';
import { getVideos, getVideoById, getSuggestedVideos } from '../services/videoService.js';
import { validateRequest } from '../middleware/validation.js';

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

export default router;

