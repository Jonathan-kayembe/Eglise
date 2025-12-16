/**
 * Utilitaires pour la gestion des dates dans le backend
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

