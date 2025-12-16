/**
 * Service d'analytics pour suivre les événements
 * Supporte Google Analytics et Plausible
 */

// Configuration
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN;

/**
 * Initialise Google Analytics
 */
export const initGA = () => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  // Charger gtag.js
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  // Initialiser gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
  });
};

/**
 * Initialise Plausible
 */
export const initPlausible = () => {
  if (!PLAUSIBLE_DOMAIN || typeof window === 'undefined') return;

  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = PLAUSIBLE_DOMAIN;
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);
};

/**
 * Initialise tous les services d'analytics
 */
export const initAnalytics = () => {
  initGA();
  initPlausible();
};

/**
 * Track un événement personnalisé (Google Analytics)
 * @param {string} eventName - Nom de l'événement
 * @param {Object} eventParams - Paramètres de l'événement
 */
export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

/**
 * Track la visualisation d'une vidéo
 * @param {string} videoId - ID de la vidéo YouTube
 * @param {string} videoTitle - Titre de la vidéo
 * @param {string} preacherName - Nom du prédicateur (optionnel)
 */
export const trackVideoView = (videoId, videoTitle, preacherName = null) => {
  trackEvent('video_view', {
    video_id: videoId,
    video_title: videoTitle,
    preacher_name: preacherName,
  });
};

/**
 * Track une recherche
 * @param {string} searchQuery - Terme de recherche
 * @param {number} resultCount - Nombre de résultats
 */
export const trackSearch = (searchQuery, resultCount = 0) => {
  trackEvent('search', {
    search_term: searchQuery,
    result_count: resultCount,
  });
};

/**
 * Track le clic sur un prédicateur
 * @param {string} preacherName - Nom du prédicateur
 */
export const trackPreacherClick = (preacherName) => {
  trackEvent('preacher_click', {
    preacher_name: preacherName,
  });
};

/**
 * Track le clic sur un thème
 * @param {string} themeName - Nom du thème
 */
export const trackThemeClick = (themeName) => {
  trackEvent('theme_click', {
    theme_name: themeName,
  });
};

/**
 * Track le changement de page
 * @param {string} pagePath - Chemin de la page
 * @param {string} pageTitle - Titre de la page
 */
export const trackPageView = (pagePath, pageTitle) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: pagePath,
      page_title: pageTitle,
    });
  }
};

export default {
  initAnalytics,
  trackEvent,
  trackVideoView,
  trackSearch,
  trackPreacherClick,
  trackThemeClick,
  trackPageView,
};

