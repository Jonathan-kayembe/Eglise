import express from 'express';
import { param, query } from 'express-validator';
import { getAllThemes, getThemeBySlug, getThemeVideos } from '../services/themeService.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

/**
 * GET /api/themes
 * Liste de tous les thèmes
 */
router.get('/', async (req, res, next) => {
  try {
    const themes = await getAllThemes();
    res.json({ themes });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/themes/:slug
 * Détails d'un thème
 */
router.get(
  '/:slug',
  [param('slug').isString().trim().notEmpty()],
  validateRequest,
  async (req, res, next) => {
    try {
      const theme = await getThemeBySlug(req.params.slug);
      
      if (!theme) {
        return res.status(404).json({ error: 'Thème non trouvé' });
      }

      res.json(theme);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/themes/:slug/videos
 * Vidéos d'un thème
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
      const theme = await getThemeBySlug(req.params.slug);
      
      if (!theme) {
        return res.status(404).json({ error: 'Thème non trouvé' });
      }

      const result = await getThemeVideos(theme.id, {
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

