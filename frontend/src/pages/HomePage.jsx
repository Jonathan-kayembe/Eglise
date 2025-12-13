import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getVideos } from '../api/videos';
import VideoCarousel from '../components/VideoCarousel';
import { VideoCard } from '../components/VideoCard';
import LoaderSkeleton from '../components/LoaderSkeleton';
import { Header } from '../components/Layout/Header';
import { Footer } from '../components/Layout/Footer';
import { sortVideosByRelevance } from '../utils/videoSortUtils';

export default function HomePage() {
  const { t } = useTranslation();
  const [videos, setVideos] = useState([]);
  const [carouselVideos, setCarouselVideos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger seulement quelques vidéos récentes pour la page d'accueil
  const loadVideos = useCallback(async () => {
    try {
      setInitialLoading(true);
      setError(null);
      
      // Charger seulement 8 vidéos les plus récentes
      const result = await getVideos({ 
        limit: 8, 
        page: 1, 
        sort: 'desc'
      });
      
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
        
        setVideos(sortedVideos);
        setFiltered(sortedVideos);
        
        // Carrousel avec les 5 premières (les plus récentes)
        setCarouselVideos(sortedVideos.slice(0, 5));
      } else {
        setVideos([]);
        setFiltered([]);
        setError('Aucune vidéo disponible pour le moment.');
      }
    } catch (e) {
      console.error('Erreur lors du chargement des vidéos:', e);
      const errorMessage = e.response?.data?.error || e.response?.data?.message || e.message || 'Erreur lors du chargement des vidéos.';
      setError(`Erreur: ${errorMessage}. Vérifiez que le backend est démarré et que la base de données contient des vidéos.`);
      setVideos([]);
      setFiltered([]);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  return (
    <div className="min-h-screen bg-[#F7F0E5] flex flex-col">
      <Header />

      <main className="flex-grow">
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
                Jésus Christ est le même hier, aujourd'hui et éternellement
              </p>
              <p className="text-lg md:text-xl text-[#7a6a5b] font-semibold">
                — Hébreux 13:8 —
              </p>
            </div>

            {/* Message de bienvenue */}
            <div className="bg-white/70 rounded-xl p-6 md:p-8 shadow-md mb-8">
              <p className="text-lg md:text-xl text-[#5A4632] leading-relaxed">
                Nous vous saluons cordialement dans le précieux Nom de notre Seigneur et Sauveur Jésus-Christ. 
                Nous nous estimons heureux de vous accueillir sur le site du Tabernacle Chrétien d'Ottawa.
              </p>
            </div>
          </div>
        </section>

        {/* Section Services */}
        <section className="py-8 px-4 bg-white/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#5A4632] text-center mb-8">
              Services
            </h2>
            <p className="text-center text-lg text-[#7a6a5b] mb-8 max-w-3xl mx-auto">
              Notre église propose une variété de services pour répondre à différents besoins spirituels et rythmes. 
              Rejoignez-nous pour un culte et une vie communautaire enrichissante.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service du dimanche */}
              <div className="bg-white/70 rounded-xl p-6 shadow-md">
                <h3 className="text-2xl font-serif font-bold text-[#5A4632] mb-3">
                  Service du dimanche
                </h3>
                <p className="text-xl font-semibold text-[#7a6a5b] mb-3">
                  10h00 - 13h00
                </p>
                <p className="text-[#5A4632]">
                  Culte principal de la semaine avec prédication, louange et communion fraternelle.
                </p>
              </div>

              {/* Service du Vendredi */}
              <div className="bg-white/70 rounded-xl p-6 shadow-md">
                <h3 className="text-2xl font-serif font-bold text-[#5A4632] mb-3">
                  Service du Vendredi
                </h3>
                <p className="text-xl font-semibold text-[#7a6a5b] mb-3">
                  19h00 - 21h00
                </p>
                <p className="text-[#5A4632]">
                  Service de prière et d'enseignement en fin de semaine pour approfondir votre foi.
                </p>
              </div>

              {/* Service en ligne */}
              <div className="bg-white/70 rounded-xl p-6 shadow-md">
                <h3 className="text-2xl font-serif font-bold text-[#5A4632] mb-3">
                  Service en ligne
                </h3>
                <p className="text-xl font-semibold text-[#7a6a5b] mb-3">
                  Mardi et jeudi à 19h00
                </p>
                <p className="text-[#5A4632]">
                  Rejoignez-nous en ligne pour un service en milieu de semaine qui rassemble virtuellement notre communauté chrétienne.
                </p>
              </div>

              {/* Ecole du dimanche */}
              <div className="bg-white/70 rounded-xl p-6 shadow-md">
                <h3 className="text-2xl font-serif font-bold text-[#5A4632] mb-3">
                  École du dimanche
                </h3>
                <p className="text-xl font-semibold text-[#7a6a5b] mb-3">
                  9h30 - 10h00
                </p>
                <p className="text-[#5A4632]">
                  Enseignement biblique adapté pour tous les âges avant le service principal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section Vidéos récentes */}
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#5A4632] text-center mb-8">
              Dernières Prédications
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
                
                {filtered.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.slice(0, 6).map(v => (
                      <VideoCard key={v.videoId} video={v} />
                    ))}
                  </div>
                )}
                
                {filtered.length > 6 && (
                  <div className="text-center mt-8">
                    <a 
                      href="/youtube" 
                      className="inline-block px-6 py-3 bg-[#5A4632] text-white rounded-lg hover:bg-[#4a3822] transition-colors font-medium text-lg"
                    >
                      Voir toutes les prédications →
                    </a>
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
