/**
 * Utilitaires pour améliorer la recherche avec gestion des variations de noms
 */

/**
 * Normalise un nom pour la comparaison
 */
export const normalizeName = (name) => {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    // Normaliser les préfixes
    .replace(/^(frère|fr|brother|br)\.?\s*/i, '')
    // Normaliser les accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Enlever les caractères spéciaux
    .replace(/[^\w\s]/g, '')
    // Enlever les espaces multiples
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Calcule la similarité entre deux chaînes (0-1)
 */
export const calculateSimilarity = (str1, str2) => {
  const s1 = normalizeName(str1);
  const s2 = normalizeName(str2);
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;
  
  // Distance de Levenshtein
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(longer, shorter);
  const similarity = 1 - (distance / longer.length);
  
  return similarity > 0 ? similarity : 0;
};

/**
 * Calcule la distance de Levenshtein
 */
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * Recherche fuzzy dans une liste de prédicateurs
 */
export const fuzzySearchPreachers = (preachers, searchTerm, threshold = 0.6) => {
  if (!searchTerm || searchTerm.trim() === '') return preachers;
  
  const normalizedSearch = normalizeName(searchTerm);
  
  return preachers
    .map(preacher => {
      const normalizedName = normalizeName(preacher.name);
      const similarity = calculateSimilarity(searchTerm, preacher.name);
      
      // Recherche exacte ou partielle
      const exactMatch = normalizedName === normalizedSearch;
      const partialMatch = normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName);
      const fuzzyMatch = similarity >= threshold;
      
      return {
        preacher,
        score: exactMatch ? 1 : (partialMatch ? 0.9 : similarity),
        match: exactMatch || partialMatch || fuzzyMatch
      };
    })
    .filter(result => result.match)
    .sort((a, b) => b.score - a.score)
    .map(result => result.preacher);
};

/**
 * Recherche fuzzy dans une liste de thèmes
 */
export const fuzzySearchThemes = (themes, searchTerm, threshold = 0.6) => {
  if (!searchTerm || searchTerm.trim() === '') return themes;
  
  const normalizedSearch = normalizeName(searchTerm);
  
  return themes
    .map(theme => {
      const normalizedName = normalizeName(theme.name);
      const similarity = calculateSimilarity(searchTerm, theme.name);
      
      const exactMatch = normalizedName === normalizedSearch;
      const partialMatch = normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName);
      const fuzzyMatch = similarity >= threshold;
      
      return {
        theme,
        score: exactMatch ? 1 : (partialMatch ? 0.9 : similarity),
        match: exactMatch || partialMatch || fuzzyMatch
      };
    })
    .filter(result => result.match)
    .sort((a, b) => b.score - a.score)
    .map(result => result.theme);
};

