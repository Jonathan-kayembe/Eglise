/**
 * Nettoie la description d'une vidéo en supprimant les informations répétitives
 * (programme, adresse, contacts, etc.)
 */
export function cleanVideoDescription(description) {
  if (!description) return '';

  let cleaned = description;

  // D'abord, extraire la première ligne utile (généralement la date et le prédicateur)
  const lines = cleaned.split('\n');
  const firstUsefulLine = lines.find(line => {
    const trimmed = line.trim();
    return trimmed && 
           trimmed.length > 5 &&
           !trimmed.includes('Ottawa Christian Tabernacle') &&
           !trimmed.includes('Publié le') &&
           !trimmed.includes('Description') &&
           !trimmed.match(/^[\*\-\=]{3,}$/); // Pas seulement des séparateurs
  });

  // Supprimer tout ce qui vient après "Publié le" ou "Description"
  const publishedIndex = cleaned.indexOf('Publié le');
  const descriptionIndex = cleaned.indexOf('Description');
  const cutIndex = Math.min(
    publishedIndex > 0 ? publishedIndex : Infinity,
    descriptionIndex > 0 ? descriptionIndex : Infinity
  );
  
  if (cutIndex < Infinity && cutIndex > 0) {
    cleaned = cleaned.substring(0, cutIndex);
  }

  // Patterns à supprimer (programme, adresse, contacts, etc.)
  const patternsToRemove = [
    // Informations sur l'église répétitives (au début ou n'importe où)
    /Ottawa Christian Tabernacle[\s\S]*?temps de la fin[\s\S]*?\n/i,
    /Ottawa Christian Tabernacle[\s\S]*?believers[\s\S]*?\n/i,
    /Église des croyants[\s\S]*?temps de la fin[\s\S]*?\n/i,
    /Church of the end-time[\s\S]*?believers[\s\S]*?\n/i,
    /Église des croyants du message biblique[\s\S]*?\n/i,
    
    // Séparateurs répétitifs (lignes entières)
    /^[\*\-\=]{5,}.*$/gm,
    
    // Programme français (tout le bloc jusqu'à la fin ou jusqu'au prochain titre)
    /Notre programme[\s\S]*?(?=Notre adresse|Contacts|$)/i,
    /Mardi et Jeudi à 19h00[\s\S]*?Culte en présentiel[\s\S]*?(?=Notre adresse|Contacts|$)/i,
    /Vendredi à 19h00[\s\S]*?Culte en présentiel[\s\S]*?(?=Notre adresse|Contacts|$)/i,
    /Dimanche à 10h00[\s\S]*?Culte en présentiel[\s\S]*?(?=Notre adresse|Contacts|$)/i,
    /Rediffusion des prédications[\s\S]*?Culte en présentiel[\s\S]*?(?=Notre adresse|Contacts|$)/i,
    
    // Programme anglais (tout le bloc)
    /Our program[\s\S]*?(?=Our address|Contacts|$)/i,
    /Tuesday and Thursday[\s\S]*?On premise service[\s\S]*?(?=Our address|Contacts|$)/i,
    /Friday at 7PM[\s\S]*?On premise service[\s\S]*?(?=Our address|Contacts|$)/i,
    /Online rebroadcast[\s\S]*?On premise service[\s\S]*?(?=Our address|Contacts|$)/i,
    
    // Adresse (tout le bloc)
    /Notre adresse[\s\S]*?(?=Contacts|$)/i,
    /Our address[\s\S]*?(?=Contacts|$)/i,
    /323.*?Montréal.*?K1L.*?(?=Contacts|$)/i,
    /323.*?Montreal.*?K1L.*?(?=Contacts|$)/i,
    /\*\*Dans le sous sol[\s\S]*?(?=Contacts|$)/i,
    /\*\*In the basement[\s\S]*?(?=Contacts|$)/i,
    /portes sur le côté[\s\S]*?(?=Contacts|$)/i,
    /side door[\s\S]*?(?=Contacts|$)/i,
    
    // Contacts (tout le bloc jusqu'à la fin)
    /Contacts?:[\s\S]*$/i,
    /studios\.oct@gmail\.com[\s\S]*$/i,
    /ottawachristiantabernacle@gmail\.com[\s\S]*$/i,
    /Pour vos requêtes[\s\S]*$/i,
    /For prayer requests[\s\S]*$/i,
    /dîmes, offrandes et dons[\s\S]*$/i,
    /tithes, offerings and voluntary[\s\S]*$/i,
    
    // Répétitions de "Ottawa Christian Tabernacle"
    /Ottawa Christian Tabernacle[\s\S]*?Church of the end-time[\s\S]*?\n/i,
  ];

  // Supprimer chaque pattern (en plusieurs passes pour être sûr)
  for (let i = 0; i < 3; i++) {
    patternsToRemove.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
  }

  // Supprimer les lignes spécifiques qui contiennent des mots-clés répétitifs
  const linesToRemove = [
    'Ottawa Christian Tabernacle',
    'Église des croyants',
    'Church of the end-time',
    'Notre programme',
    'Our program',
    'Mardi et Jeudi',
    'Tuesday and Thursday',
    'Vendredi',
    'Friday',
    'Dimanche',
    'Sunday',
    'Notre adresse',
    'Our address',
    '323 Montréal',
    '323 Montreal',
    'Dans le sous sol',
    'In the basement',
    'portes sur le côté',
    'side door',
    'Contacts',
    'studios.oct@gmail.com',
    'ottawachristiantabernacle@gmail.com',
    'Pour vos requêtes',
    'For prayer requests',
    'dîmes, offrandes',
    'tithes, offerings',
  ];

  cleaned = cleaned.split('\n')
    .filter(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 3) return false;
      
      // Supprimer les lignes qui sont seulement des séparateurs
      if (trimmed.match(/^[\*\-\=]{3,}$/)) return false;
      
      // Supprimer les lignes qui commencent par des mots-clés répétitifs
      const startsWithKeyword = linesToRemove.some(keyword => 
        trimmed.toLowerCase().startsWith(keyword.toLowerCase())
      );
      if (startsWithKeyword) return false;
      
      // Supprimer les lignes qui contiennent seulement des emails
      if (trimmed.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return false;
      
      return true;
    })
    .join('\n');

  // Nettoyer les lignes vides multiples
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Supprimer les espaces en début et fin
  cleaned = cleaned.trim();

  // Si après nettoyage il ne reste rien ou très peu, utiliser la première ligne utile
  if (cleaned.length < 20) {
    return firstUsefulLine || lines[0] || description.substring(0, 200).trim();
  }

  return cleaned;
}

/**
 * Extrait la première ligne utile de la description (généralement le titre/date)
 */
export function getDescriptionPreview(description, maxLength = 150) {
  if (!description) return '';
  
  const cleaned = cleanVideoDescription(description);
  const firstLine = cleaned.split('\n')[0].trim();
  
  if (firstLine.length <= maxLength) {
    return firstLine;
  }
  
  return firstLine.substring(0, maxLength) + '...';
}
