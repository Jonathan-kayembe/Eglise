import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getVideos } from '../../api/videos';

/**
 * Composant de filtre par prédicateurs
 * Extrait les prédicateurs depuis les vidéos et permet de les filtrer
 */
export const PreacherFilter = ({ onPreacherSelect, selectedPreacher }) => {
  const { t } = useTranslation();
  const [preachers, setPreachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreachers();
  }, []);

  const loadPreachers = async () => {
    try {
      setLoading(true);
      // Charger toutes les vidéos pour extraire les prédicateurs
      const result = await getVideos({ limit: 1000, page: 1, sort: 'desc' });
      
      if (result && result.videos) {
        // Extraire les prédicateurs uniques depuis les vidéos
        const preachersMap = new Map();
        
        result.videos.forEach(video => {
          // Méthode 1: Depuis le champ preacher
          if (video.preacher && video.preacher.name) {
            const name = video.preacher.name;
            if (preachersMap.has(name)) {
              preachersMap.set(name, preachersMap.get(name) + 1);
            } else {
              preachersMap.set(name, 1);
            }
          }
          
          // Méthode 2: Extraire depuis le titre si pas de prédicateur associé
          if (!video.preacher && video.title) {
            const preacherPatterns = [
              /(?:Frère|Fr|Brother|Br)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
              /-\s*(?:Frère|Fr|Brother|Br)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
              /(?:Frère|Fr|Brother|Br)\s+([^:,\-]+?)(?:\s*[,:\-]|$)/i,
            ];
            
            preacherPatterns.forEach(pattern => {
              const match = video.title.match(pattern);
              if (match && match[1]) {
                let name = match[1].trim();
                name = name.replace(/[,:\-\[\]()]/g, '').trim();
                
                if (name.length > 2 && name.length < 50 && /^[A-Za-zÀ-ÿ\s]+$/.test(name)) {
                  const normalizedName = name.split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                  
                  if (preachersMap.has(normalizedName)) {
                    preachersMap.set(normalizedName, preachersMap.get(normalizedName) + 1);
                  } else {
                    preachersMap.set(normalizedName, 1);
                  }
                }
              }
            });
          }
        });

        // Convertir en tableau et trier par nombre de vidéos (décroissant)
        const preachersList = Array.from(preachersMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        console.log('Prédicateurs trouvés:', preachersList.length, preachersList);
        setPreachers(preachersList);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des prédicateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreacherClick = (preacherName) => {
    if (selectedPreacher === preacherName) {
      // Désélectionner si déjà sélectionné
      onPreacherSelect(null);
    } else {
      onPreacherSelect(preacherName);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-wrap gap-2 justify-center">
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-28 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (preachers.length === 0 && !loading) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="max-w-7xl mx-auto px-4 py-4 bg-white/50 rounded-lg shadow-sm">
        <h3 className="text-lg font-serif text-[#5A4632] mb-4 text-center">
          {t('youtube.filterByPreacher')}
        </h3>
        <div className="flex flex-wrap gap-2 justify-center max-h-48 overflow-y-auto">
          <button
            onClick={() => onPreacherSelect(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              !selectedPreacher
                ? 'bg-[#5A4632] text-white shadow-md'
                : 'bg-white text-[#5A4632] hover:bg-[#F7F0E5] border border-[#5A4632]/20'
            }`}
          >
            {t('common.all')}
          </button>
          {preachers.map((preacher, index) => (
            <motion.button
              key={preacher.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => handlePreacherClick(preacher.name)}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                selectedPreacher === preacher.name
                  ? 'bg-[#5A4632] text-white shadow-md'
                  : 'bg-white text-[#5A4632] hover:bg-[#F7F0E5] border border-[#5A4632]/20'
              }`}
            >
              {preacher.name}
              <span className="ml-2 text-xs opacity-75">({preacher.count})</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
