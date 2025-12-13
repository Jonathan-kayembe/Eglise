import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { VideoCard } from './VideoCard';

export default function VideoCarousel({ videos }) {
  const swiperRef = useRef(null);

  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-6xl mx-auto mb-8 px-4 relative">
      <Swiper
        ref={swiperRef}
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        navigation={false}
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        breakpoints={{
          640: { slidesPerView: 1.2 },
          1024: { slidesPerView: 2 }
        }}
        className="video-carousel"
      >
        {videos.map(v => (
          <SwiperSlide key={v.videoId}>
            <VideoCard video={v} />
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* Boutons de navigation personnalisés avec zone cliquable plus grande */}
      <button 
        onClick={() => swiperRef.current?.swiper?.slidePrev()}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white shadow-xl rounded-full p-4 w-14 h-14 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
        aria-label="Vidéo précédente"
        style={{ pointerEvents: 'auto' }}
      >
        <svg className="w-7 h-7 text-[#5A4632]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button 
        onClick={() => swiperRef.current?.swiper?.slideNext()}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white shadow-xl rounded-full p-4 w-14 h-14 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
        aria-label="Vidéo suivante"
        style={{ pointerEvents: 'auto' }}
      >
        <svg className="w-7 h-7 text-[#5A4632]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

