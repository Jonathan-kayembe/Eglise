import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getVideoById, getSuggestedVideos } from '../api/videos';
import { VideoCard } from '../components/VideoCard/VideoCard';
import { SEO } from '../components/SEO';
import { cleanVideoDescription } from '../utils/descriptionUtils';
import { getVideoDisplayDate, formatDate } from '../utils/dateUtils';
import { trackVideoView } from '../utils/analytics';

export const VideoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [suggestedVideos, setSuggestedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    loadVideo();
  }, [id]);

  const loadVideo = async () => {
    setLoading(true);
    try {
      const [videoData, suggestedData] = await Promise.all([
        getVideoById(id),
        getSuggestedVideos(id)
      ]);
      setVideo(videoData);
      setSuggestedVideos(suggestedData);
      
      // Track analytics
      if (videoData) {
        trackVideoView(
          videoData.youtubeId,
          videoData.title,
          videoData.preacher?.name
        );
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la vidéo:', error);
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

  if (!video) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-gray-600">{t('common.videoNotFound')}</p>
      </div>
    );
  }

  const videoUrl = video ? `${window.location.origin}/video/${video.id}` : '';
  const videoImage = video?.thumbnail || '/logo.png';

  return (
    <div className="container mx-auto px-4 py-12">
      {video && (
        <SEO
          title={video.title}
          description={cleanVideoDescription(video.description) || `Prédication par ${video.preacher?.name || 'Ottawa Christian Tabernacle'}`}
          image={videoImage}
          url={videoUrl}
          type="video"
          videoId={video.youtubeId}
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        {/* Bouton Retour */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#5A4632] hover:text-[#4a3822] transition-colors font-medium"
            aria-label="Retour à la page précédente"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('common.back')}
          </button>
        </div>

        {/* Player YouTube */}
        <div className="mb-8">
          <div className="aspect-video bg-black-deep rounded-xl overflow-hidden shadow-2xl">
            <iframe
              src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=0`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
              aria-label={`Lecteur vidéo YouTube : ${video.title}`}
            />
          </div>
        </div>

        {/* Informations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-display font-bold text-black-deep mb-4">
              {video.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-6 text-gray-600">
              {(() => {
                const displayDate = getVideoDisplayDate(video);
                return displayDate ? (
                  <span>
                    {t('common.published')} {formatDate(displayDate, i18n.language)}
                  </span>
                ) : null;
              })()}
              {video.preacher && (
                <span>
                  {t('common.by')}{' '}
                  <Link
                    to={`/preacher/${video.preacher.slug}`}
                    className="text-gold hover:underline font-medium"
                  >
                    {video.preacher.name}
                  </Link>
                </span>
              )}
              {video.theme && (
                <Link
                  to={`/theme/${video.theme.slug}`}
                  className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${video.theme.color}40`,
                    color: video.theme.color
                  }}
                >
                  {video.theme.name}
                </Link>
              )}
            </div>

            {video.description && (
              <div className="prose max-w-none mb-8">
                <h2 className="text-2xl font-display font-semibold mb-4">
                  {t('video.description')}
                </h2>
                <p className="text-gray-700 whitespace-pre-line">
                  {cleanVideoDescription(video.description)}
                </p>
              </div>
            )}

            {/* Description standard de l'église */}
            <div className="prose max-w-none mb-8 mt-8 pt-8 border-t border-gray-200">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {t('video.churchInfo')}
              </p>
            </div>

            {video.tags && video.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {video.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-beige rounded-full text-sm text-gray-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar avec suggestions */}
          {suggestedVideos.length > 0 && (
            <div>
              <h2 className="text-2xl font-display font-semibold mb-6">
                {t('video.suggested')}
              </h2>
              <div className="space-y-4">
                {suggestedVideos.map((suggested) => (
                  <VideoCard key={suggested.id} video={suggested} />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

