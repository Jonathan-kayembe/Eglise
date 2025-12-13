import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getThemeBySlug, getThemeVideos } from '../api/themes';
import { VideoCard } from '../components/VideoCard/VideoCard';

export const ThemePage = () => {
  const { slug } = useParams();
  const [theme, setTheme] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadTheme();
  }, [slug]);

  const loadTheme = async () => {
    setLoading(true);
    try {
      const [themeData, videosData] = await Promise.all([
        getThemeBySlug(slug),
        getThemeVideos(slug, { limit: 50 })
      ]);
      setTheme(themeData);
      setVideos(videosData.videos);
    } catch (error) {
      console.error('Erreur lors du chargement du thème:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        <p className="mt-4 text-gray-600">{t('common.loading')}</p>
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-gray-600">{t('common.themeNotFound')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1
          className="text-5xl font-display font-bold mb-4"
          style={{ color: theme.color }}
        >
          {theme.name}
        </h1>
        {theme.description && (
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {theme.description}
          </p>
        )}
      </motion.div>

      <motion.h2
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-3xl font-display font-bold text-black-deep mb-8"
      >
        {t('theme.videos')} ({videos.length})
      </motion.h2>

      {videos.length === 0 ? (
        <p className="text-gray-600">{t('common.noResults')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video, index) => (
            <VideoCard key={video.id} video={video} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

