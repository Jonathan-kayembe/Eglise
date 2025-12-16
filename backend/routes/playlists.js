import express from 'express';
import { query, param } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import {
  getAllPlaylists,
  getPlaylistBySlug,
  getPlaylistVideos,
  syncAutoPlaylists
} from '../services/playlistService.js';

const router = express.Router();

/**
 * GET /api/playlists
 * Liste toutes les playlists
 */
router.get(
  '/',
  [
    query('featured').optional().isBoolean().toBoolean(),
    query('type').optional().isIn(['preacher', 'theme', 'custom'])
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const playlists = await getAllPlaylists({
        featured: req.query.featured,
        type: req.query.type
      });
      res.json({ playlists });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/playlists/:slug
 * Détails d'une playlist
 */
router.get(
  '/:slug',
  [param('slug').isString().trim()],
  validateRequest,
  async (req, res, next) => {
    try {
      const playlist = await getPlaylistBySlug(req.params.slug);
      
      if (!playlist) {
        return res.status(404).json({ error: 'Playlist non trouvée' });
      }

      res.json(playlist);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/playlists/:slug/videos
 * Vidéos d'une playlist
 */
router.get(
  '/:slug/videos',
  [
    param('slug').isString().trim(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('page').optional().isInt({ min: 1 }).toInt()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const playlist = await getPlaylistBySlug(req.params.slug);
      
      if (!playlist) {
        return res.status(404).json({ error: 'Playlist non trouvée' });
      }

      const result = await getPlaylistVideos(playlist.id, {
        limit: req.query.limit || 50,
        page: req.query.page || 1
      });

      res.json({
        playlist,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/playlists/sync
 * Synchronise les playlists automatiques (prédicateurs et thèmes)
 */
router.post(
  '/sync',
  async (req, res, next) => {
    try {
      const stats = await syncAutoPlaylists();
      res.json({
        success: true,
        message: 'Playlists synchronisées avec succès',
        stats
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

