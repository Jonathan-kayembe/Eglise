import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getPreacherBySlug, getPreacherVideos } from '../api/preachers';
import { BackgroundSlideshow } from '../components/BackgroundSlideshow/BackgroundSlideshow';
import { VideoCard } from '../components/VideoCard/VideoCard';

export const PreacherPage = () => {
  const { slug } = useParams();
  const [preacher, setPreacher] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadPreacher();
  }, [slug]);

  const loadPreacher = async () => {
    setLoading(true);
    try {
      const [preacherData, videosData] = await Promise.all([
        getPreacherBySlug(slug),
        getPreacherVideos(slug, { limit: 50 })
      ]);
      setPreacher(preacherData);
      setVideos(videosData.videos);
    } catch (error) {
      console.error('Erreur lors du chargement du prédicateur:', error);
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

  if (!preacher) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-gray-600">{t('common.preacherNotFound')}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Hero Section avec BackgroundSlideshow */}
      <div className="relative h-[60vh] min-h-[500px] flex items-center justify-center">
        <BackgroundSlideshow images={preacher.backgroundImages || []} />
        
        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            {preacher.photo && (
              <img
                src={preacher.photo}
                alt={preacher.name}
                className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-white shadow-2xl object-cover"
              />
            )}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-6xl font-display font-bold text-black-deep mb-4"
          >
            {preacher.name}
          </motion.h1>
          {preacher.bio && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-black-deep max-w-2xl mx-auto"
            >
              {preacher.bio}
            </motion.p>
          )}
        </div>
      </div>

      {/* Section Vidéos */}
      <div className="container mx-auto px-4 py-12">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl font-display font-bold text-black-deep mb-8"
        >
          {t('preacher.videos')} ({videos.length})
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
    </div>
  );
};

