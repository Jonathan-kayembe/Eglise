import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { VideoCard } from './VideoCard';

export default function VideoGrid({ videos, loading, totalPages: externalTotalPages, currentPage: externalCurrentPage, onPageChange }) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(externalCurrentPage || 1);
  const [videosPerPage, setVideosPerPage] = useState(12);

  // Calculer le nombre de vidéos par page selon la taille d'écran
  useEffect(() => {
    const updateVideosPerPage = () => {
      if (window.innerWidth >= 1024) {
        setVideosPerPage(12); // Desktop: 12 vidéos
      } else if (window.innerWidth >= 640) {
        setVideosPerPage(6); // Tablette: 6 vidéos
      } else {
        setVideosPerPage(4); // Mobile: 4 vidéos
      }
    };

    updateVideosPerPage();
    window.addEventListener('resize', updateVideosPerPage);
    return () => window.removeEventListener('resize', updateVideosPerPage);
  }, []);

  // Si on utilise la pagination externe (via props)
  const useExternalPagination = externalTotalPages !== undefined && onPageChange;
  const totalPages = useExternalPagination ? externalTotalPages : Math.ceil(videos.length / videosPerPage);
  const activePage = useExternalPagination ? externalCurrentPage : currentPage;

  // Recalculer la pagination si le nombre de vidéos change
  useEffect(() => {
    if (!useExternalPagination) {
      const calculatedTotalPages = Math.ceil(videos.length / videosPerPage);
      if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
        setCurrentPage(calculatedTotalPages);
      } else if (currentPage < 1 && calculatedTotalPages > 0) {
        setCurrentPage(1);
      }
    }
  }, [videos.length, videosPerPage, currentPage, useExternalPagination]);

  // Calculer les vidéos à afficher
  const getCurrentVideos = () => {
    if (useExternalPagination) {
      // Si pagination externe, afficher toutes les vidéos (elles sont déjà filtrées)
      return videos;
    } else {
      // Pagination locale
      const startIndex = (currentPage - 1) * videosPerPage;
      const endIndex = startIndex + videosPerPage;
      return videos.slice(startIndex, endIndex);
    }
  };

  const currentVideos = getCurrentVideos();

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      if (useExternalPagination) {
        onPageChange(page);
      } else {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const goToPrevious = () => {
    if (activePage > 1) {
      goToPage(activePage - 1);
    }
  };

  const goToNext = () => {
    if (activePage < totalPages) {
      goToPage(activePage + 1);
    }
  };

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (activePage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (activePage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = activePage - 1; i <= activePage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (!videos || videos.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 text-center py-12">
        <p className="text-[#7a6a5b] text-lg">{t('common.noVideosFound')}</p>
        {!loading && (
          <p className="text-[#7a6a5b] text-sm mt-2">
            {t('common.checkBackend')}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Grille des vidéos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {currentVideos.map((v, index) => {
          // Vérifier que la vidéo a les propriétés nécessaires
          if (!v || (!v.videoId && !v.id && !v.youtubeId)) {
            console.warn('Vidéo invalide:', v);
            return null;
          }
          return (
            <VideoCard 
              key={v.id || v.videoId || v.youtubeId || `video-${index}`} 
              video={v} 
              index={index}
            />
          );
        })}
      </div>

      {/* Indicateur de chargement */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5A4632]"></div>
          <p className="text-[#7a6a5b] mt-2">{t('common.loading')}</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 mt-8 pt-8 border-t border-[#5A4632]/10">
          {/* Informations de pagination */}
          <div className="text-sm text-[#7a6a5b]">
            {t('pagination.page')} {activePage} {t('pagination.of')} {totalPages}
            {useExternalPagination && videos.length > 0 && (
              <span> ({videos.length} {videos.length > 1 ? t('common.videos') : t('common.video')} {videos.length > 1 ? t('common.displayedPlural') : t('common.displayed')})</span>
            )}
            {!useExternalPagination && (
              <span> ({videos.length} {videos.length > 1 ? t('common.videos') : t('common.video')})</span>
            )}
          </div>

          {/* Contrôles de pagination */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* Bouton Précédent */}
            <button
              onClick={goToPrevious}
              disabled={activePage === 1}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activePage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#5A4632] text-white hover:bg-[#4a3822] active:scale-95'
              }`}
              aria-label={t('pagination.previous')}
            >
              {t('pagination.previous')}
            </button>

            {/* Numéros de page */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 text-[#7a6a5b]">
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`min-w-[40px] h-10 px-3 rounded-lg font-medium transition-all ${
                      activePage === page
                        ? 'bg-[#5A4632] text-white shadow-md'
                        : 'bg-white text-[#5A4632] hover:bg-[#F7F0E5] border border-[#5A4632]/20'
                    }`}
                    aria-label={`Aller à la page ${page}`}
                    aria-current={activePage === page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Bouton Suivant */}
            <button
              onClick={goToNext}
              disabled={activePage === totalPages}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activePage === totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#5A4632] text-white hover:bg-[#4a3822] active:scale-95'
              }`}
              aria-label={t('pagination.next')}
            >
              {t('pagination.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

