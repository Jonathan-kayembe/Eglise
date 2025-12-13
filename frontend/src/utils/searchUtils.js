/**
 * Utilitaires pour améliorer la recherche
 */

/**
 * Extrait le nom du prédicateur du titre de la vidéo
 * Format attendu: "Date - Frère Nom : Titre" ou "Date - Nom : Titre"
 */
export function extractPreacherFromTitle(title) {
  if (!title) return null;
  
  // Patterns communs pour extraire le prédicateur
  const patterns = [
    /-\s*(?:Frère|Fr|Brother|Br)\s+([^:]+?)\s*:/i,  // " - Frère Nom :"
    /-\s*([^:]+?)\s*:/i,                              // " - Nom :"
    /(?:Frère|Fr|Brother|Br)\s+([^:]+?)\s*:/i,        // "Frère Nom :"
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

/**
 * Formate une date pour la recherche
 * Supporte plusieurs formats de date
 */
export function formatDateForSearch(dateString) {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    const formats = [
      date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }), // DD/MM/YYYY
      date.toISOString().split('T')[0], // YYYY-MM-DD
      date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'), // DD-MM-YYYY
      date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), // D MMMM YYYY
      date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }), // MMMM YYYY
    ];
    
    return formats;
  } catch (e) {
    return null;
  }
}

/**
 * Vérifie si une recherche correspond à une date
 */
export function isDateSearch(query) {
  if (!query) return false;
  
  // Patterns de date communs
  const datePatterns = [
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/,  // DD/MM/YYYY ou DD-MM-YYYY
    /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,    // YYYY-MM-DD ou YYYY/MM/DD
    /^\d{1,2}\s+\w+\s+\d{4}$/,               // D MMMM YYYY
    /^\w+\s+\d{4}$/,                         // MMMM YYYY
  ];
  
  return datePatterns.some(pattern => pattern.test(query.trim()));
}

