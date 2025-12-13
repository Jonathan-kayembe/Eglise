import express from 'express';
import { query } from 'express-validator';
import { getVideos } from '../services/videoService.js';
import { getAllPreachers } from '../services/preacherService.js';
import { getAllThemes } from '../services/themeService.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

/**
 * GET /api/search
 * Recherche globale
 */
router.get(
  '/',
  [
    query('q').isString().trim().notEmpty().withMessage('Le terme de recherche est requis'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('page').optional().isInt({ min: 1 }).toInt()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const searchTerm = req.query.q;
      const limit = req.query.limit || 20;
      const page = req.query.page || 1;

      // Recherche dans les vidéos
      const videoResults = await getVideos({
        q: searchTerm,
        limit,
        page,
        sort: 'desc'
      });

      // Recherche dans les prédicateurs
      const allPreachers = await getAllPreachers();
      const preacherResults = allPreachers.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.bio && p.bio.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      // Recherche dans les thèmes
      const allThemes = await getAllThemes();
      const themeResults = allThemes.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      res.json({
        videos: videoResults,
        preachers: preacherResults,
        themes: themeResults,
        query: searchTerm
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

