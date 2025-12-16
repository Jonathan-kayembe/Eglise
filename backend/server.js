import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createConnection } from './config/database.js';
import videoRoutes from './routes/videos.js';
import preacherRoutes from './routes/preachers.js';
import themeRoutes from './routes/themes.js';
import searchRoutes from './routes/search.js';
import playlistRoutes from './routes/playlists.js';
import youtubeRoutes from './routes/youtube.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  standardHeaders: true, // Retourne les infos de rate limit dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  handler: (req, res) => {
    res.status(429).json({
      error: 'Trop de requêtes',
      message: 'Vous avez dépassé la limite de requêtes. Veuillez réessayer dans quelques minutes.',
      retryAfter: Math.ceil(15 * 60) // 15 minutes en secondes
    });
  }
});

app.use('/api/', limiter);

// Routes
app.use('/api/videos', videoRoutes);
app.use('/api/preachers', preacherRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/youtube', youtubeRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialisation de la base de données et démarrage du serveur
createConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
    });
  })
  .catch((error) => {
    console.error('❌ Erreur de connexion à la base de données:', error);
    process.exit(1);
  });

export default app;

