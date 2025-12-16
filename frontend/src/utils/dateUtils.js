/**
 * Utilitaires pour la gestion des dates
 */

/**
 * Extrait la date du titre de la vidéo
 * Formats supportés: "DD/MM/YYYY - ...", "DD-MM-YYYY - ...", "DD.MM.YYYY - ..."
 * @param {string} title - Le titre de la vidéo
 * @returns {Date|null} - La date extraite ou null si non trouvée
 */
export function extractDateFromTitle(title) {
  if (!title) return null;

  // Patterns pour extraire la date au début du titre
  // Format: "DD/MM/YYYY - ..." ou "DD-MM-YYYY - ..." ou "DD.MM.YYYY - ..."
  const datePatterns = [
    /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,  // YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD
  ];

  for (const pattern of datePatterns) {
    const match = title.match(pattern);
    if (match) {
      let day, month, year;
      
      // Déterminer le format (DD/MM/YYYY ou YYYY/MM/DD)
      if (match[1].length === 4) {
        // Format YYYY/MM/DD
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10);
        day = parseInt(match[3], 10);
      } else {
        // Format DD/MM/YYYY (format européen le plus courant)
        day = parseInt(match[1], 10);
        month = parseInt(match[2], 10);
        year = parseInt(match[3], 10);
      }

      // Valider la date
      if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day);
        // Vérifier que la date est valide (évite les dates invalides comme 31/02)
        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
          return date;
        }
      }
    }
  }

  return null;
}

/**
 * Formate une date selon la langue sélectionnée
 * @param {Date|string} date - La date à formater
 * @param {string} locale - La locale ('fr' ou 'en')
 * @returns {string} - La date formatée
 */
export function formatDate(date, locale = 'fr') {
  if (!date) return '';

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Vérifier que la date est valide
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const localeMap = {
      fr: 'fr-FR',
      en: 'en-US'
    };

    const localeCode = localeMap[locale] || 'fr-FR';

    return dateObj.toLocaleDateString(localeCode, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return '';
  }
}

/**
 * Obtient la date à afficher pour une vidéo
 * Priorité: date extraite du titre > date de publication YouTube
 * @param {Object} video - L'objet vidéo
 * @returns {Date|null} - La date à afficher
 */
export function getVideoDisplayDate(video) {
  if (!video) return null;

  // Essayer d'extraire la date du titre
  const titleDate = extractDateFromTitle(video.title);
  if (titleDate) {
    return titleDate;
  }

  // Sinon, utiliser la date de publication YouTube
  if (video.publishedAt) {
    try {
      return new Date(video.publishedAt);
    } catch (error) {
      console.error('Erreur lors de la conversion de publishedAt:', error);
      return null;
    }
  }

  return null;
}

