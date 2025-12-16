import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getVideos } from '../api/videos';
import { search as searchAPI } from '../api/search';
import VideoCarousel from '../components/VideoCarousel';
import { SearchBar } from '../components/SearchBar/SearchBar';
import VideoGrid from '../components/VideoGrid';
import LoaderSkeleton from '../components/LoaderSkeleton';
import { Header } from '../components/Layout/Header';
import { Footer } from '../components/Layout/Footer';
import { SEO } from '../components/SEO';
import { sortVideosByRelevance } from '../utils/videoSortUtils';

export function VideosPage() {
  const { t } = useTranslation();
  const [videos, setVideos] = useState([]);
  const [carouselVideos, setCarouselVideos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  // Charger les vidéos avec pagination
  const loadVideos = useCallback(async (page = 1, search = '') => {
    try {
      setLoading(true);
      setError(null); // Toujours réinitialiser l'erreur au début
      
      let result;
      const searchTrimmed = search ? search.trim() : '';
      if (searchTrimmed !== '') {
        try {
          const searchResult = await searchAPI(searchTrimmed, {
            limit: 12,
            page: page
          });
          // L'API de recherche retourne { videos: { videos: [...], pagination: {...} }, ... }
          if (searchResult && searchResult.videos) {
            result = searchResult.videos; // result = { videos: [...], pagination: {...} }
          } else {
            result = { videos: [], pagination: { page, totalPages: 1, total: 0 } };
          }
        } catch (searchError) {
          console.error('Erreur lors de la recherche:', searchError);
          setError(searchError.response?.data?.error || searchError.message || t('home.errorLoadingVideos'));
          result = { videos: [], pagination: { page, totalPages: 1, total: 0 } };
        }
      } else {
        result = await getVideos({ 
          limit: 12, 
          page: page, 
          sort: 'desc'
        });
      }
      
      if (result && result.videos && result.videos.length > 0) {
        const formattedVideos = result.videos.map(v => ({
          id: v.id,
          videoId: v.youtubeId || v.videoId, // Support les deux formats
          youtubeId: v.youtubeId || v.videoId, // Garder aussi youtubeId pour compatibilité
          title: v.title || 'Sans titre',
          description: v.description || '',
          channelTitle: v.preacher?.name || 'Ottawa Christian Tabernacle',
          thumbnails: {
            medium: { url: v.thumbnail || '' },
            high: { url: v.thumbnail || '' }
          },
          publishedAt: v.publishedAt,
          tags: v.tags || [],
          thumbnail: v.thumbnail || '',
          duration: v.duration || 0,
          viewCount: v.viewCount || 0,
          preacher: v.preacher || null,
          theme: v.theme || null
        })).filter(v => v.id || v.videoId || v.youtubeId); // Filtrer les vidéos vraiment invalides
        
        if (formattedVideos.length > 0) {
          const sortedVideos = sortVideosByRelevance(formattedVideos);
          setVideos(sortedVideos);
          setFiltered(sortedVideos);
        
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages || 1);
          setTotalVideos(result.pagination.total || sortedVideos.length);
          setCurrentPage(result.pagination.page || page);
        } else {
          setTotalPages(1);
          setTotalVideos(sortedVideos.length);
          setCurrentPage(page);
        }
        
        if (page === 1 && !search) {
          setCarouselVideos(sortedVideos.slice(0, 5));
        } else {
          setCarouselVideos([]);
        }
        } else {
        setVideos([]);
        setFiltered([]);
        setTotalPages(1);
        setTotalVideos(0);
        setCarouselVideos([]);
        if (page === 1 && !search) {
          setError(t('home.noVideosAvailable'));
        } else {
          setError(null);
        }
      }
      }
    } catch (e) {
      console.error('Erreur lors du chargement des vidéos:', e);
      let errorMessage = e.response?.data?.error || e.response?.data?.message || e.message || t('home.errorLoadingVideos');
      
      // Messages d'erreur plus clairs selon le type d'erreur
      if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
        errorMessage = 'La requête a pris trop de temps. Le serveur est peut-être surchargé.';
      } else if (e.message?.includes('Network Error') || e.message?.includes('connecter au serveur')) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
      }
      
      setError(`${t('common.error')}: ${errorMessage}. ${t('home.errorCheckBackend')}`);
      setVideos([]);
      setFiltered([]);
      setCarouselVideos([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [t]);

  // Chargement initial
  useEffect(() => {
    loadVideos(1, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recherche en temps réel
  useEffect(() => {
    if (initialLoading) return;
    const timer = setTimeout(() => {
      setCurrentPage(1);
      setError(null); // Réinitialiser l'erreur quand on change la recherche
      // Si la recherche est vide, recharger toutes les vidéos
      loadVideos(1, searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, initialLoading]);

  // Gestion du changement de page
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    loadVideos(page, searchQuery);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const onSearch = useCallback((query) => {
    setSearchQuery(query.trim());
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F0E5] flex flex-col">
      <SEO
        title="Toutes les vidéos"
        description="Découvrez toutes nos prédications et enseignements du Tabernacle Chrétien d'Ottawa."
      />
      <Header />

      <main className="flex-grow py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#5A4632] text-center mb-8">
            {t('videos.allVideos') || 'Toutes les prédications'}
          </h1>
          
          {/* Barre de recherche */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar onSearch={onSearch} />
          </div>
          
          {initialLoading ? (
            <LoaderSkeleton />
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-white/70 rounded-xl p-8 shadow-md max-w-2xl mx-auto">
                <svg className="w-16 h-16 mx-auto mb-4 text-[#7a6a5b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[#5A4632] text-lg font-semibold mb-2">{t('common.error')}</p>
                <p className="text-[#7a6a5b] text-base mb-4">{error}</p>
              </div>
            </div>
          ) : (
            <>
              {!searchQuery && carouselVideos.length > 0 && (
                <div className="mb-8">
                  <VideoCarousel videos={carouselVideos} />
                </div>
              )}
              
              {searchQuery && (
                <div className="max-w-7xl mx-auto px-4 mb-6">
                  <h2 className="text-2xl font-serif text-[#5A4632]">
                    {t('home.searchResults', { query: searchQuery, count: totalVideos })}
                  </h2>
                </div>
              )}
              
              {filtered && filtered.length > 0 ? (
                <VideoGrid 
                  videos={filtered} 
                  loading={loading}
                  totalPages={totalPages}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-[#7a6a5b] text-lg">{t('home.noVideosFound') || t('common.noVideosFound')}</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default VideosPage;
