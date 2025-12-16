import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { getLiveVideo } from '../../api/youtube';

/**
 * Composant LiveBanner
 * Affiche un bandeau avec le lecteur YouTube si un live est en cours
 * Ne s'affiche pas s'il n'y a pas de live
 */
export const LiveBanner = () => {
  const { t } = useTranslation();
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        setLoading(true);
        const result = await getLiveVideo();
        setLive(result.live);
      } catch (error) {
        console.error('Erreur lors du chargement du live:', error);
        setLive(null);
      } finally {
        setLoading(false);
      }
    };

    // Charger le live au montage du composant
    fetchLive();

    // Rafraîchir toutes les 60 secondes pour détecter les nouveaux lives
    const interval = setInterval(fetchLive, 60000);

    return () => clearInterval(interval);
  }, []);

  // Ne rien afficher si pas de live ou en chargement
  if (loading || !live) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full mb-8"
      aria-label={t('live.bannerLabel') || 'Vidéo en direct'}
    >
      {/* Conteneur principal avec ombre et bordure arrondie */}
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-red-500">
        {/* Bandeau "EN DIRECT" avec animation */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-600 text-white py-4 px-6">
          <div className="flex items-center justify-center gap-3">
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-3xl md:text-4xl"
              role="img"
              aria-label="Live"
            >
              🔴
            </motion.span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-wide uppercase">
              {t('live.title') || 'EN DIRECT'}
            </h2>
          </div>
        </div>

        {/* Titre du live */}
        <div className="px-6 py-4 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 line-clamp-2">
            {live.title}
          </h3>
        </div>

        {/* Lecteur YouTube avec ratio 16:9 */}
        <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={`https://www.youtube.com/embed/${live.id}?autoplay=0&rel=0&modestbranding=1`}
            title={live.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
            aria-label={`Lecteur vidéo YouTube en direct : ${live.title}`}
          />
        </div>
      </div>
    </motion.section>
  );
};

export default LiveBanner;

