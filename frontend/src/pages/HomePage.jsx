import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getVideos } from '../api/videos';
import VideoCarousel from '../components/VideoCarousel';
import { VideoCard } from '../components/VideoCard';
import LoaderSkeleton from '../components/LoaderSkeleton';
import { Header } from '../components/Layout/Header';
import { Footer } from '../components/Layout/Footer';
import { SEO } from '../components/SEO';
import { LiveBanner } from '../components/LiveBanner';
import { sortVideosByRelevance } from '../utils/videoSortUtils';

export default function HomePage() {
  const { t } = useTranslation();
  const [videos, setVideos] = useState([]);
  const [carouselVideos, setCarouselVideos] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger seulement quelques vidéos pour la page d'accueil
  const loadVideos = useCallback(async () => {
    try {
      setInitialLoading(true);
      setError(null);
      
      const result = await getVideos({ 
        limit: 6, 
        page: 1, 
        sort: 'desc'
      });
      
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
        setCarouselVideos(sortedVideos.slice(0, 5));
      } else {
        setVideos([]);
        setCarouselVideos([]);
        setError(t('home.noVideosAvailable'));
      }
    } catch (e) {
      console.error('Erreur lors du chargement des vidéos:', e);
      const errorMessage = e.response?.data?.error || e.response?.data?.message || e.message || t('home.errorLoadingVideos');
      setError(`${t('common.error')}: ${errorMessage}. ${t('home.errorCheckBackend')}`);
      setVideos([]);
      setCarouselVideos([]);
    } finally {
      setInitialLoading(false);
    }
  }, [t]);

  // Chargement initial
  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  return (
    <div className="min-h-screen bg-[#F7F0E5] flex flex-col">
      <SEO
        title="Accueil"
        description="Site officiel du Tabernacle Chrétien d'Ottawa. Regardez nos prédications, découvrez nos services et rejoignez notre communauté."
      />
      <Header />

      <main className="flex-grow">
        {/* Section Live YouTube - S'affiche uniquement si un live est en cours, tout en haut */}
        <div className="w-full">
          <div className="max-w-7xl mx-auto px-4 pt-8">
            <LiveBanner />
          </div>
        </div>

        {/* Section de présentation de l'église */}
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <img 
              src="/logo.png" 
              alt="Ottawa Christian Tabernacle Logo" 
              className="h-32 md:h-40 w-auto object-contain mx-auto mb-6"
              style={{ 
                backgroundColor: 'transparent',
                background: 'transparent'
              }}
            />
            
            {/* Verset */}
            <div className="mb-8">
              <p className="text-2xl md:text-3xl font-serif italic text-[#5A4632] mb-4">
                {t('home.verse')}
              </p>
              <p className="text-lg md:text-xl text-[#7a6a5b] font-semibold">
                {t('home.verseReference')}
              </p>
            </div>

            {/* Message de bienvenue */}
            <div className="bg-white/70 rounded-xl p-6 md:p-8 shadow-md mb-8">
              <p className="text-lg md:text-xl text-[#5A4632] leading-relaxed">
                {t('home.welcomeText')}
              </p>
            </div>
          </div>
        </section>

        {/* Section Services */}
        <section className="py-8 px-4 bg-white/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#5A4632] text-center mb-8">
              {t('home.services')}
            </h2>
            <p className="text-center text-lg text-[#7a6a5b] mb-8 max-w-3xl mx-auto">
              {t('home.servicesDescription')}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service du dimanche */}
              <div className="bg-white/70 rounded-xl p-6 shadow-md">
                <h3 className="text-2xl font-serif font-bold text-[#5A4632] mb-3">
                  {t('home.sundayService')}
                </h3>
                <p className="text-xl font-semibold text-[#7a6a5b] mb-3">
                  {t('home.sundayServiceTime')}
                </p>
                <p className="text-[#5A4632]">
                  {t('home.sundayServiceDescription')}
                </p>
              </div>

              {/* Service du Vendredi */}
              <div className="bg-white/70 rounded-xl p-6 shadow-md">
                <h3 className="text-2xl font-serif font-bold text-[#5A4632] mb-3">
                  {t('home.fridayService')}
                </h3>
                <p className="text-xl font-semibold text-[#7a6a5b] mb-3">
                  {t('home.fridayServiceTime')}
                </p>
                <p className="text-[#5A4632]">
                  {t('home.fridayServiceDescription')}
                </p>
              </div>

              {/* Service en ligne */}
              <div className="bg-white/70 rounded-xl p-6 shadow-md">
                <h3 className="text-2xl font-serif font-bold text-[#5A4632] mb-3">
                  {t('home.onlineService')}
                </h3>
                <p className="text-xl font-semibold text-[#7a6a5b] mb-3">
                  {t('home.onlineServiceTime')}
                </p>
                <p className="text-[#5A4632]">
                  {t('home.onlineServiceDescription')}
                </p>
              </div>

              {/* Ecole du dimanche */}
              <div className="bg-white/70 rounded-xl p-6 shadow-md">
                <h3 className="text-2xl font-serif font-bold text-[#5A4632] mb-3">
                  {t('home.sundaySchool')}
                </h3>
                <p className="text-xl font-semibold text-[#7a6a5b] mb-3">
                  {t('home.sundaySchoolTime')}
                </p>
                <p className="text-[#5A4632]">
                  {t('home.sundaySchoolDescription')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section Vidéos - Aperçu */}
        <section id="videos" className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#5A4632] text-center mb-8">
              {t('home.sermons') || 'Prédications'}
            </h2>
            
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
                {carouselVideos.length > 0 && (
                  <div className="mb-8">
                    <VideoCarousel videos={carouselVideos} />
                  </div>
                )}
                
                {videos && videos.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {videos.map((v, index) => {
                        if (!v || (!v.videoId && !v.id)) {
                          return null;
                        }
                        return (
                          <VideoCard 
                            key={v.id || v.videoId || `video-${index}`} 
                            video={v} 
                            index={index}
                          />
                        );
                      })}
                    </div>
                    
                    {/* Bouton pour voir toutes les vidéos */}
                    <div className="text-center mt-8">
                      <Link
                        to="/videos"
                        className="btn-primary inline-block"
                      >
                        {t('home.viewAllVideos') || 'Voir toutes les vidéos'}
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-[#7a6a5b] text-lg">{t('home.noVideosFound') || t('common.noVideosFound')}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
