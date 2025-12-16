import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LazyImage } from '../LazyImage';
import { getVideoDisplayDate, formatDate } from '../../utils/dateUtils';

export const VideoCard = ({ video, index = 0 }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Vérifier que la vidéo est valide
  if (!video) {
    console.warn('VideoCard: vidéo invalide', video);
    return null;
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClick = () => {
    if (video.id) {
      // Navigation vers la page de détail si l'ID existe
      navigate(`/video/${video.id}`);
    } else if (video.videoId) {
      // Sinon, ouvrir directement YouTube
      window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank');
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className="card cursor-pointer"
      onClick={handleClick}
      role="article"
      aria-label={`Vidéo : ${video.title || 'Sans titre'}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div>
        <div className="relative aspect-video overflow-hidden bg-black-deep">
          {video.thumbnail ? (
            <LazyImage
              src={video.thumbnail}
              alt={video.title || 'Vidéo'}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              onError={() => {}}
            />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center" role="img" aria-label="Pas de miniature disponible">
              <span className="text-gray-500">Pas de miniature</span>
            </div>
          )}
          {video.duration > 0 && (
            <div className="absolute bottom-2 right-2 bg-black-deep bg-opacity-80 text-white px-2 py-1 rounded text-sm">
              {formatDuration(video.duration)}
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-display font-semibold text-lg mb-2 line-clamp-2 text-black-deep">
            {video.title || 'Sans titre'}
          </h3>
          <div className="flex items-center justify-between text-sm text-gray-600">
            {video.preacher && (
              <Link
                to={`/preacher/${video.preacher.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:text-gold transition-colors"
              >
                {video.preacher.name}
              </Link>
            )}
            {(() => {
              const displayDate = getVideoDisplayDate(video);
              return displayDate ? (
                <span>{formatDate(displayDate, i18n.language)}</span>
              ) : null;
            })()}
          </div>
          {video.theme && (
            <div className="mt-2">
              <Link
                to={`/theme/${video.theme.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${video.theme.color}40`,
                  color: video.theme.color
                }}
              >
                {video.theme.name}
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
};

