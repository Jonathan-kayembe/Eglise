import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getVideos } from '../api/videos';
import { search as searchAPI } from '../api/search';
import { Header } from '../components/Layout/Header';
import { Footer } from '../components/Layout/Footer';
import { SearchBar } from '../components/SearchBar/SearchBar';
import { PreacherFilter } from '../components/PreacherFilter/PreacherFilter';
import VideoCarousel from '../components/VideoCarousel';
import VideoGrid from '../components/VideoGrid';
import LoaderSkeleton from '../components/LoaderSkeleton';
import { sortVideosByRelevance } from '../utils/videoSortUtils';

/**
 * Page dédiée pour afficher les vidéos YouTube
 * Route: /youtube
 * Utilise maintenant l'API backend pour avoir les mêmes vidéos que la page d'accueil
 */
export const YouTubePage = () => {
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
  const [selectedPreacher, setSelectedPreacher] = useState(null);
  const [error, setError] = useState(null);

  // Charger les vidéos avec pagination
  const loadVideos = useCallback(async (page = 1, search = '', preacherName = null) => {
    try {
      setLoading(true);
      setError(null);
      
      // Si une recherche est effectuée, utiliser l'API de recherche globale
      let result;
      if (search && search.trim() !== '') {
        const searchResult = await searchAPI(search.trim(), {
          limit: 12,
          page: page
        });
        if (searchResult.videos && searchResult.videos.videos) {
          result = searchResult.videos;
        } else {
          result = { videos: [], pagination: { page, totalPages: 1, total: 0 } };
        }
      } else {
        // Si un prédicateur est sélectionné, charger toutes les vidéos et filtrer côté client
        const shouldLoadAll = preacherName !== null;
        const limit = shouldLoadAll ? 1000 : 12;
        
        result = await getVideos({ 
          limit, 
          page: shouldLoadAll ? 1 : page, 
          sort: 'desc',
          q: search || undefined
        });
      }
      
      if (result && result.videos && result.videos.length > 0) {
        // Convertir le format backend au format attendu par les composants
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
        
        // Trier les vidéos selon un ordre intelligent (date, ID, popularité)
        const sortedVideos = sortVideosByRelevance(formattedVideos);
        
        // Filtrer par prédicateur si sélectionné
        let finalVideos = sortedVideos;
        if (preacherName) {
          finalVideos = sortedVideos.filter(v => 
            v.preacher && v.preacher.name === preacherName
          );
          // Re-trier après filtrage pour maintenir l'ordre intelligent
          finalVideos = sortVideosByRelevance(finalVideos);
        }
        
        setVideos(finalVideos);
        
        // Mettre à jour la pagination
        if (preacherName) {
          // Pagination côté client pour les prédicateurs
          const videosPerPage = 12;
          const total = finalVideos.length;
          setTotalPages(Math.ceil(total / videosPerPage));
          setTotalVideos(total);
          setCurrentPage(1);
          const startIndex = (1 - 1) * videosPerPage;
          const endIndex = startIndex + videosPerPage;
          setFiltered(finalVideos.slice(startIndex, endIndex));
        } else {
          setFiltered(finalVideos);
          if (result.pagination) {
            setTotalPages(result.pagination.totalPages || 1);
            setTotalVideos(result.pagination.total || sortedVideos.length);
            setCurrentPage(result.pagination.page || page);
          } else {
            setTotalPages(1);
            setTotalVideos(sortedVideos.length);
            setCurrentPage(page);
          }
        }
        
        // Charger les vidéos du carrousel seulement à la première page sans filtre
        if (page === 1 && !search && !preacherName) {
          setCarouselVideos(finalVideos.slice(0, 5));
        } else if (preacherName) {
          setCarouselVideos([]);
        }
      } else {
        setVideos([]);
        setFiltered([]);
        setTotalPages(1);
        setTotalVideos(0);
        if (page === 1 && !search) {
          setError('Aucune vidéo disponible pour le moment.');
        }
      }
    } catch (e) {
      console.error('Erreur lors du chargement des vidéos:', e);
      const errorMessage = e.response?.data?.error || e.response?.data?.message || e.message || 'Erreur lors du chargement des vidéos.';
      setError(`Erreur: ${errorMessage}. Vérifiez que le backend est démarré et que la base de données contient des vidéos.`);
      setVideos([]);
      setFiltered([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    setInitialLoading(true);
    loadVideos(1, '');
  }, [loadVideos]);

  // Recherche en temps réel
  useEffect(() => {
    if (initialLoading) return;

    const timer = setTimeout(() => {
      if (searchQuery.trim() === '') {
        setCurrentPage(1);
        loadVideos(1, '', selectedPreacher);
      } else {
        setCurrentPage(1);
        loadVideos(1, searchQuery, selectedPreacher);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, initialLoading, loadVideos, selectedPreacher]);

  // Gérer le changement de prédicateur
  const handlePreacherSelect = useCallback((preacherName) => {
    setSelectedPreacher(preacherName);
    setCurrentPage(1);
    setSearchQuery('');
    loadVideos(1, '', preacherName);
  }, [loadVideos]);

  // Gestion du changement de page
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    
    if (selectedPreacher) {
      const videosPerPage = 12;
      const startIndex = (page - 1) * videosPerPage;
      const endIndex = startIndex + videosPerPage;
      setFiltered(videos.slice(startIndex, endIndex));
    } else {
      loadVideos(page, searchQuery, null);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loadVideos, searchQuery, selectedPreacher, videos]);

  // Mettre à jour la pagination quand on change de page avec un prédicateur sélectionné
  useEffect(() => {
    if (selectedPreacher && videos.length > 0) {
      const videosPerPage = 12;
      const startIndex = (currentPage - 1) * videosPerPage;
      const endIndex = startIndex + videosPerPage;
      setFiltered(videos.slice(startIndex, endIndex));
    }
  }, [currentPage, selectedPreacher, videos]);

  const onSearch = useCallback((query) => {
    setSearchQuery(query.trim());
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F0E5] flex flex-col">
      <Header />

      <main className="flex-grow">
        <section className="py-6">
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-center text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-[#5A4632] mb-2 tracking-tight">
              {t('nav.youtube') || 'Prédications'}
            </h1>
            <p className="text-center text-lg md:text-xl text-[#7a6a5b] mt-2 mb-8">
              Découvrez toutes nos dernières prédications et enseignements
            </p>
          </div>

          {/* Barre de recherche */}
          <div className="mt-8 px-4">
            <SearchBar onSearch={onSearch} />
          </div>
        </section>

        {/* Filtre par prédicateurs */}
        {!initialLoading && !error && (
          <section className="mt-6 mb-8">
            <PreacherFilter 
              onPreacherSelect={handlePreacherSelect}
              selectedPreacher={selectedPreacher}
            />
          </section>
        )}

        {initialLoading ? (
          <LoaderSkeleton />
        ) : error ? (
          <section className="mt-8 pb-24 md:pb-32">
            <div className="max-w-7xl mx-auto px-4 text-center py-12">
              <div className="bg-white/70 rounded-xl p-8 shadow-md">
                <svg className="w-16 h-16 mx-auto mb-4 text-[#7a6a5b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[#5A4632] text-lg font-semibold mb-2">{t('common.error')}</p>
                <p className="text-[#7a6a5b] text-base mb-4">{error}</p>
                <p className="text-[#7a6a5b] text-sm">
                  Assurez-vous que le backend est démarré et que les vidéos ont été synchronisées.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <>
            {!searchQuery && carouselVideos.length > 0 && (
              <section className="mt-8">
                <VideoCarousel videos={carouselVideos} />
              </section>
            )}

            <section className="mt-4 pb-24 md:pb-32">
              {(searchQuery || selectedPreacher) && (
                <div className="max-w-7xl mx-auto px-4 mb-6">
                  <h2 className="text-2xl font-serif text-[#5A4632]">
                    {selectedPreacher && (
                      <span>{t('nav.preachers')}: {selectedPreacher} ({totalVideos} {totalVideos > 1 ? 'vidéos' : 'vidéo'})</span>
                    )}
                    {searchQuery && selectedPreacher && ' - '}
                    {searchQuery && (
                      <span>{t('common.search')} "{searchQuery}"</span>
                    )}
                    {!selectedPreacher && !searchQuery && (
                      <span>{totalVideos} {totalVideos > 1 ? 'vidéos' : 'vidéo'}</span>
                    )}
                  </h2>
                </div>
              )}
              <VideoGrid 
                videos={filtered} 
                loading={loading}
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default YouTubePage;

