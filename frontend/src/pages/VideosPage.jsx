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
      setError(null);
      
      let result;
      if (search && search.trim() !== '') {
        try {
          const searchResult = await searchAPI(search.trim(), {
            limit: 12,
            page: page
          });
          if (searchResult && searchResult.videos) {
            result = searchResult.videos;
          } else {
            result = { videos: [], pagination: { page, totalPages: 1, total: 0 } };
          }
        } catch (searchError) {
          console.error('Erreur lors de la recherche:', searchError);
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
          videoId: v.youtubeId,
          title: v.title,
          description: v.description,
          channelTitle: v.preacher?.name || 'Ottawa Christian Tabernacle',
          thumbnails: {
            medium: { url: v.thumbnail },
            high: { url: v.thumbnail }
          },
          publishedAt: v.publishedAt,
          tags: v.tags || [],
          thumbnail: v.thumbnail,
          duration: v.duration,
          viewCount: v.viewCount,
          preacher: v.preacher,
          theme: v.theme
        }));
        
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
        if (page === 1 && !search) {
          setError(t('home.noVideosAvailable'));
        }
      }
    } catch (e) {
      console.error('Erreur lors du chargement des vidéos:', e);
      const errorMessage = e.response?.data?.error || e.response?.data?.message || e.message || t('home.errorLoadingVideos');
      setError(`${t('common.error')}: ${errorMessage}. ${t('home.errorCheckBackend')}`);
      setVideos([]);
      setFiltered([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [t]);

  // Chargement initial
  useEffect(() => {
    loadVideos(1, '');
  }, [loadVideos]);

  // Recherche en temps réel
  useEffect(() => {
    if (initialLoading) return;
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadVideos(1, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, initialLoading, loadVideos]);

  // Gestion du changement de page
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    loadVideos(page, searchQuery);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loadVideos, searchQuery]);

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
