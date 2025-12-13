/**
 * Fonction de tri personnalisée pour les vidéos
 * Classe les vidéos selon plusieurs critères pour un meilleur ordre d'affichage
 */
export function sortVideosByRelevance(videos) {
  if (!videos || videos.length === 0) return videos;

  return [...videos].sort((a, b) => {
    // 1. Priorité : Date de publication (plus récent en premier)
    const dateA = a.publishedAt ? new Date(a.publishedAt) : null;
    const dateB = b.publishedAt ? new Date(b.publishedAt) : null;
    
    const isValidDateA = dateA && !isNaN(dateA.getTime());
    const isValidDateB = dateB && !isNaN(dateB.getTime());
    
    if (isValidDateA && isValidDateB) {
      const dateDiff = dateB.getTime() - dateA.getTime();
      // Si la différence de date est significative (plus de 1 jour), utiliser la date
      if (Math.abs(dateDiff) > 24 * 60 * 60 * 1000) {
        return dateDiff;
      }
      // Si les dates sont très proches (moins de 1 jour), continuer avec d'autres critères
    } else if (isValidDateA && !isValidDateB) {
      return -1; // A a une date valide, B non -> A en premier
    } else if (!isValidDateA && isValidDateB) {
      return 1; // B a une date valide, A non -> B en premier
    }
    
    // 2. Critère secondaire : ID (plus récent en premier, car les IDs plus élevés sont généralement plus récents)
    const idDiff = (b.id || 0) - (a.id || 0);
    if (idDiff !== 0) {
      return idDiff;
    }
    
    // 3. Critère tertiaire : Nombre de vues (plus de vues = plus populaire = en premier)
    const viewsA = a.viewCount || 0;
    const viewsB = b.viewCount || 0;
    if (viewsA !== viewsB) {
      return viewsB - viewsA; // Plus de vues en premier
    }
    
    // 4. Critère final : Ordre alphabétique du titre (pour stabilité)
    const titleA = (a.title || '').toLowerCase();
    const titleB = (b.title || '').toLowerCase();
    return titleA.localeCompare(titleB, 'fr');
  });
}

/**
 * Trie les vidéos par date de publication (plus récent en premier)
 * Version simple et rapide
 */
export function sortVideosByDate(videos) {
  if (!videos || videos.length === 0) return videos;

  return [...videos].sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0);
    const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0);
    
    const isValidA = !isNaN(dateA.getTime());
    const isValidB = !isNaN(dateB.getTime());
    
    if (!isValidA && !isValidB) {
      return (b.id || 0) - (a.id || 0);
    }
    if (!isValidA) return 1;
    if (!isValidB) return -1;
    
    const diff = dateB.getTime() - dateA.getTime();
    return diff !== 0 ? diff : (b.id || 0) - (a.id || 0);
  });
}

/**
 * Trie les vidéos par popularité (vues + date récente)
 */
export function sortVideosByPopularity(videos) {
  if (!videos || videos.length === 0) return videos;

  return [...videos].sort((a, b) => {
    // Score de popularité = vues + bonus pour les vidéos récentes
    const viewsA = a.viewCount || 0;
    const viewsB = b.viewCount || 0;
    
    const dateA = a.publishedAt ? new Date(a.publishedAt) : null;
    const dateB = b.publishedAt ? new Date(b.publishedAt) : null;
    
    // Bonus pour les vidéos récentes (moins de 30 jours = bonus)
    let bonusA = 0;
    let bonusB = 0;
    
    if (dateA && !isNaN(dateA.getTime())) {
      const daysSinceA = (Date.now() - dateA.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceA < 30) {
        bonusA = (30 - daysSinceA) * 100; // Bonus décroissant
      }
    }
    
    if (dateB && !isNaN(dateB.getTime())) {
      const daysSinceB = (Date.now() - dateB.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceB < 30) {
        bonusB = (30 - daysSinceB) * 100;
      }
    }
    
    const scoreA = viewsA + bonusA;
    const scoreB = viewsB + bonusB;
    
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    
    // Si même score, trier par date
    if (dateA && dateB) {
      return dateB.getTime() - dateA.getTime();
    }
    
    return (b.id || 0) - (a.id || 0);
  });
}
