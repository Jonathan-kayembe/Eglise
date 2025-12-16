import express from 'express';
import { query } from 'express-validator';
import { getVideos } from '../services/videoService.js';
import { getAllPreachers } from '../services/preacherService.js';
import { getAllThemes } from '../services/themeService.js';
import { validateRequest } from '../middleware/validation.js';
import { fuzzySearchPreachers, fuzzySearchThemes } from '../utils/searchUtils.js';

const router = express.Router();

/**
 * GET /api/search
 * Recherche globale
 */
router.get(
  '/',
  [
    query('q').optional().isString().trim(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('page').optional().isInt({ min: 1 }).toInt()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const searchTerm = (req.query.q || '').trim();
      
      // Si aucun terme de recherche n'est fourni, retourner des résultats vides
      if (!searchTerm || searchTerm === '') {
        return res.json({
          videos: { videos: [], pagination: { page: 1, totalPages: 1, total: 0 } },
          preachers: [],
          themes: [],
          query: ''
        });
      }
      
      const limit = req.query.limit || 20;
      const page = req.query.page || 1;

      // Recherche dans les vidéos
      const videoResults = await getVideos({
        q: searchTerm,
        limit,
        page,
        sort: 'desc'
      });

      // Recherche dans les prédicateurs avec fuzzy search (seuil abaissé à 0.5 pour plus de tolérance)
      const allPreachers = await getAllPreachers();
      const preacherResults = fuzzySearchPreachers(allPreachers, searchTerm, 0.5)
        .filter(p => {
          // Recherche aussi dans la bio (avec normalisation des accents)
          const normalizedBio = p.bio ? p.bio.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
          const normalizedSearch = searchTerm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const bioMatch = normalizedBio.includes(normalizedSearch);
          return true; // Les résultats fuzzy sont déjà filtrés
        });

      // Recherche dans les thèmes avec fuzzy search (seuil abaissé à 0.5 pour plus de tolérance)
      const allThemes = await getAllThemes();
      const themeResults = fuzzySearchThemes(allThemes, searchTerm, 0.5)
        .filter(t => {
          // Recherche aussi dans la description (avec normalisation des accents)
          const normalizedDesc = t.description ? t.description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
          const normalizedSearch = searchTerm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const descMatch = normalizedDesc.includes(normalizedSearch);
          return true; // Les résultats fuzzy sont déjà filtrés
        });

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

