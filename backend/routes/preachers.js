import express from 'express';
import { param, query } from 'express-validator';
import { getAllPreachers, getPreacherBySlug, getPreacherVideos } from '../services/preacherService.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

/**
 * GET /api/preachers
 * Liste de tous les prédicateurs
 */
router.get('/', async (req, res, next) => {
  try {
    const preachers = await getAllPreachers();
    res.json({ preachers });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/preachers/:slug
 * Détails d'un prédicateur
 */
router.get(
  '/:slug',
  [param('slug').isString().trim().notEmpty()],
  validateRequest,
  async (req, res, next) => {
    try {
      const preacher = await getPreacherBySlug(req.params.slug);
      
      if (!preacher) {
        return res.status(404).json({ error: 'Prédicateur non trouvé' });
      }

      res.json(preacher);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/preachers/:slug/videos
 * Vidéos d'un prédicateur
 */
router.get(
  '/:slug/videos',
  [
    param('slug').isString().trim().notEmpty(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('page').optional().isInt({ min: 1 }).toInt()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const preacher = await getPreacherBySlug(req.params.slug);
      
      if (!preacher) {
        return res.status(404).json({ error: 'Prédicateur non trouvé' });
      }

      const result = await getPreacherVideos(preacher.id, {
        limit: req.query.limit,
        page: req.query.page
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

