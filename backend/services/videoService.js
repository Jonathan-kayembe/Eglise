import getConnection from '../config/database.js';
import { normalizeName, calculateSimilarity } from '../utils/searchUtils.js';

/**
 * Normalise les mois français vers anglais pour la recherche
 */
const normalizeMonth = (text) => {
  const monthMap = {
    'janvier': 'january',
    'fevrier': 'february',
    'février': 'february',
    'mars': 'march',
    'avril': 'april',
    'mai': 'may',
    'juin': 'june',
    'juillet': 'july',
    'aout': 'august',
    'août': 'august',
    'septembre': 'september',
    'octobre': 'october',
    'novembre': 'november',
    'decembre': 'december',
    'décembre': 'december'
  };
  
  let normalized = text.toLowerCase();
  for (const [fr, en] of Object.entries(monthMap)) {
    normalized = normalized.replace(new RegExp(`\\b${fr}\\b`, 'gi'), en);
  }
  return normalized;
};

/**
 * Récupère les vidéos avec pagination et filtres
 */
export const getVideos = async (options = {}) => {
  const {
    limit = 20,
    page = 1,
    preacherId = null,
    themeId = null,
    q = null,
    sort = 'desc'
  } = options;

  const offset = (page - 1) * limit;
  const db = getConnection();
  const conditions = [];
  const params = [];

  // Filtre par prédicateur
  if (preacherId) {
    conditions.push('v.preacher_id = ?');
    params.push(preacherId);
  }

  // Filtre par thème
  if (themeId) {
    conditions.push('v.theme_id = ?');
    params.push(themeId);
  }

  // Recherche textuelle (titre, description, prédicateur, thème, date, tags)
  // Améliorée pour être tolérante aux accents et fautes d'orthographe
  if (q) {
    // Normaliser la recherche pour gérer "et" dans les dates (ex: "15 - janvier et 2024")
    let normalizedQuery = q.toLowerCase().trim();
    // Remplacer " et " par " " pour la recherche de date
    normalizedQuery = normalizedQuery.replace(/\s+et\s+/g, ' ');
    
    // Normaliser les mois français vers anglais
    const normalizedQueryWithEnglishMonths = normalizeMonth(normalizedQuery);
    
    // Normaliser les mois à 1 chiffre vers 2 chiffres pour la recherche de date
    // Ex: "15 - 1 2024" devient "15 - 01 2024"
    const normalizedQueryWithTwoDigitMonths = normalizedQuery.replace(
      /(\d{1,2})\s*-\s*(\d{1})\s+(\d{4})/g,
      (match, day, month, year) => {
        const paddedMonth = month.padStart(2, '0');
        return `${day} - ${paddedMonth} ${year}`;
      }
    );
    
    const searchTerm = `%${q}%`;
    // Normaliser le terme de recherche (enlever les accents) pour recherche plus flexible
    const normalizedSearchTerm = normalizedQuery
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s\-]/g, '');
    const normalizedSearchTermLike = `%${normalizedSearchTerm}%`;
    
    // Pour les dates avec mois en anglais (MySQL DATE_FORMAT retourne en anglais)
    const normalizedSearchTermForDate = normalizedQueryWithEnglishMonths
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s\-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Pour les dates avec mois en chiffres (normaliser à 2 chiffres)
    const normalizedSearchTermForNumericDate = normalizedQueryWithTwoDigitMonths
      .normalize('NFD')
      .replace(/[^\w\s\-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Recherche dans titre, description, nom du prédicateur, nom du thème, date formatée, et tags
    // Recherche avec ET sans accents pour tolérer les fautes (ex: "francois" trouve "François")
    // Les JOINs sont toujours présents dans la requête principale, donc p.name et t.name sont disponibles
    conditions.push(`(
      LOWER(v.title) LIKE LOWER(?)
      OR LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        v.title, 'à', 'a'), 'é', 'e'), 'è', 'e'), 'ê', 'e'), 'ë', 'e'), 
        'î', 'i'), 'ï', 'i'), 'ô', 'o'), 'ù', 'u'), 'û', 'u')) LIKE ?
      OR LOWER(v.description) LIKE LOWER(?)
      OR LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        v.description, 'à', 'a'), 'é', 'e'), 'è', 'e'), 'ê', 'e'), 'ë', 'e'), 
        'î', 'i'), 'ï', 'i'), 'ô', 'o'), 'ù', 'u'), 'û', 'u')) LIKE ?
      OR LOWER(p.name) LIKE LOWER(?)
      OR LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        p.name, 'à', 'a'), 'é', 'e'), 'è', 'e'), 'ê', 'e'), 'ë', 'e'), 
        'î', 'i'), 'ï', 'i'), 'ô', 'o'), 'ù', 'u'), 'û', 'u')) LIKE ?
      OR LOWER(t.name) LIKE LOWER(?)
      OR LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        t.name, 'à', 'a'), 'é', 'e'), 'è', 'e'), 'ê', 'e'), 'ë', 'e'), 
        'î', 'i'), 'ï', 'i'), 'ô', 'o'), 'ù', 'u'), 'û', 'u')) LIKE ?
      OR DATE_FORMAT(v.published_at, '%d/%m/%Y') LIKE ?
      OR DATE_FORMAT(v.published_at, '%Y-%m-%d') LIKE ?
      OR DATE_FORMAT(v.published_at, '%d-%m-%Y') LIKE ?
      OR DATE_FORMAT(v.published_at, '%d %B %Y') LIKE ?
      OR CONCAT(DATE_FORMAT(v.published_at, '%d'), ' - ', DATE_FORMAT(v.published_at, '%M'), ' ', DATE_FORMAT(v.published_at, '%Y')) LIKE LOWER(?)
      OR CONCAT(DATE_FORMAT(v.published_at, '%d'), ' - ', DATE_FORMAT(v.published_at, '%M'), ' et ', DATE_FORMAT(v.published_at, '%Y')) LIKE LOWER(?)
      OR CONCAT(DATE_FORMAT(v.published_at, '%d'), ' - ', DATE_FORMAT(v.published_at, '%m'), ' ', DATE_FORMAT(v.published_at, '%Y')) LIKE ?
      OR CONCAT(DATE_FORMAT(v.published_at, '%d'), ' - ', DATE_FORMAT(v.published_at, '%m'), ' et ', DATE_FORMAT(v.published_at, '%Y')) LIKE ?
      OR CONCAT(DATE_FORMAT(v.published_at, '%d'), ' - ', CAST(DATE_FORMAT(v.published_at, '%m') AS UNSIGNED), ' ', DATE_FORMAT(v.published_at, '%Y')) LIKE ?
      OR CONCAT(DATE_FORMAT(v.published_at, '%d'), ' - ', CAST(DATE_FORMAT(v.published_at, '%m') AS UNSIGNED), ' et ', DATE_FORMAT(v.published_at, '%Y')) LIKE ?
      OR CONCAT(DATE_FORMAT(v.published_at, '%d'), ' - ', 
        CASE DATE_FORMAT(v.published_at, '%m')
          WHEN '01' THEN 'janvier' WHEN '02' THEN 'février' WHEN '03' THEN 'mars'
          WHEN '04' THEN 'avril' WHEN '05' THEN 'mai' WHEN '06' THEN 'juin'
          WHEN '07' THEN 'juillet' WHEN '08' THEN 'août' WHEN '09' THEN 'septembre'
          WHEN '10' THEN 'octobre' WHEN '11' THEN 'novembre' WHEN '12' THEN 'décembre'
        END, ' ', DATE_FORMAT(v.published_at, '%Y')) LIKE LOWER(?)
      OR CONCAT(DATE_FORMAT(v.published_at, '%d'), ' - ', 
        CASE DATE_FORMAT(v.published_at, '%m')
          WHEN '01' THEN 'janvier' WHEN '02' THEN 'février' WHEN '03' THEN 'mars'
          WHEN '04' THEN 'avril' WHEN '05' THEN 'mai' WHEN '06' THEN 'juin'
          WHEN '07' THEN 'juillet' WHEN '08' THEN 'août' WHEN '09' THEN 'septembre'
          WHEN '10' THEN 'octobre' WHEN '11' THEN 'novembre' WHEN '12' THEN 'décembre'
        END, ' et ', DATE_FORMAT(v.published_at, '%Y')) LIKE LOWER(?)
      OR DATE_FORMAT(v.published_at, '%B %Y') LIKE ?
      OR DATE_FORMAT(v.published_at, '%Y') LIKE ?
      OR DATE_FORMAT(v.published_at, '%m/%Y') LIKE ?
      OR DATE_FORMAT(v.published_at, '%m-%Y') LIKE ?
      OR DATE_FORMAT(v.published_at, '%B') LIKE LOWER(?)
      OR (v.tags IS NOT NULL AND LOWER(v.tags) LIKE LOWER(?))
    )`);
    params.push(
      searchTerm, // v.title (avec accents)
      normalizedSearchTermLike, // v.title (sans accents)
      searchTerm, // v.description (avec accents)
      normalizedSearchTermLike, // v.description (sans accents)
      searchTerm, // p.name (avec accents)
      normalizedSearchTermLike, // p.name (sans accents)
      searchTerm, // t.name (avec accents)
      normalizedSearchTermLike, // t.name (sans accents)
      searchTerm, // date format 1: dd/mm/yyyy
      searchTerm, // date format 2: yyyy-mm-dd
      searchTerm, // date format 3: dd-mm-yyyy
      searchTerm, // date format 4: dd Month yyyy
      `%${normalizedSearchTermForDate}%`, // date format 5: dd - Month yyyy (anglais, ex: "15 - January 2024")
      `%${normalizedSearchTermForDate}%`, // date format 6: dd - Month et yyyy (anglais, ex: "15 - January et 2024")
      `%${normalizedSearchTermForNumericDate}%`, // date format 7: dd - mm yyyy (2 chiffres, ex: "15 - 01 2024")
      `%${normalizedSearchTermForNumericDate}%`, // date format 8: dd - mm et yyyy (2 chiffres, ex: "15 - 01 et 2024")
      `%${normalizedQueryWithTwoDigitMonths}%`, // date format 9: dd - m yyyy (1 chiffre normalisé, ex: "15 - 1 2024" → "15 - 01 2024")
      `%${normalizedQueryWithTwoDigitMonths}%`, // date format 10: dd - m et yyyy (1 chiffre normalisé, ex: "15 - 1 et 2024" → "15 - 01 et 2024")
      `%${normalizedQuery}%`, // date format 9: dd - mois yyyy (français, ex: "15 - janvier 2024")
      `%${normalizedQuery}%`, // date format 10: dd - mois et yyyy (français, ex: "15 - janvier et 2024")
      searchTerm, // date format 11: Month yyyy
      searchTerm, // année seule
      searchTerm, // mois/année 1: mm/yyyy
      searchTerm, // mois/année 2: mm-yyyy
      searchTerm, // mois en texte
      searchTerm // tags
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = sort === 'asc' ? 'ASC' : 'DESC';

  // Toujours inclure les JOINs pour que p.name et t.name soient disponibles même sans recherche
  const query = `
    SELECT 
      v.*,
      p.id as preacher_id,
      p.name as preacher_name,
      p.slug as preacher_slug,
      p.photo as preacher_photo,
      t.id as theme_id,
      t.name as theme_name,
      t.slug as theme_slug,
      t.color as theme_color
    FROM videos v
    LEFT JOIN preachers p ON v.preacher_id = p.id
    LEFT JOIN themes t ON v.theme_id = t.id
    ${whereClause}
    ORDER BY v.published_at ${orderBy}, v.id ${orderBy}
    LIMIT ? OFFSET ?
  `;

  params.push(limit, offset);

  const [videos] = await db.execute(query, params);

  // Compter le total (avec les mêmes JOINs que la requête principale)
  const countQuery = `
    SELECT COUNT(*) as total
    FROM videos v
    LEFT JOIN preachers p ON v.preacher_id = p.id
    LEFT JOIN themes t ON v.theme_id = t.id
    ${whereClause}
  `;
  const [countResult] = await db.execute(countQuery, params.slice(0, -2));
  const total = countResult[0].total;

  return {
    videos: videos.map(formatVideo),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Récupère une vidéo par ID
 */
export const getVideoById = async (id) => {
  const db = getConnection();
  const [videos] = await db.execute(
    `SELECT 
      v.*,
      p.id as preacher_id,
      p.name as preacher_name,
      p.slug as preacher_slug,
      p.photo as preacher_photo,
      t.id as theme_id,
      t.name as theme_name,
      t.slug as theme_slug,
      t.color as theme_color
    FROM videos v
    LEFT JOIN preachers p ON v.preacher_id = p.id
    LEFT JOIN themes t ON v.theme_id = t.id
    WHERE v.id = ?`,
    [id]
  );

  if (videos.length === 0) {
    return null;
  }

  return formatVideo(videos[0]);
};

/**
 * Récupère une vidéo par YouTube ID
 */
export const getVideoByYoutubeId = async (youtubeId) => {
  const db = getConnection();
  const [videos] = await db.execute(
    `SELECT 
      v.*,
      p.id as preacher_id,
      p.name as preacher_name,
      p.slug as preacher_slug,
      p.photo as preacher_photo,
      t.id as theme_id,
      t.name as theme_name,
      t.slug as theme_slug,
      t.color as theme_color
    FROM videos v
    LEFT JOIN preachers p ON v.preacher_id = p.id
    LEFT JOIN themes t ON v.theme_id = t.id
    WHERE v.youtube_id = ?`,
    [youtubeId]
  );

  if (videos.length === 0) {
    return null;
  }

  return formatVideo(videos[0]);
};

/**
 * Crée ou met à jour une vidéo
 */
export const upsertVideo = async (videoData) => {
  const db = getConnection();
  const {
    youtubeId,
    title,
    description,
    thumbnail,
    preacherId,
    themeId,
    publishedAt,
    tags,
    duration,
    viewCount
  } = videoData;

  // Vérifier si la vidéo existe déjà
  const existing = await getVideoByYoutubeId(youtubeId);

  if (existing) {
    // Mise à jour
    await db.execute(
      `UPDATE videos SET
        title = ?,
        description = ?,
        thumbnail = ?,
        preacher_id = ?,
        theme_id = ?,
        published_at = ?,
        tags = ?,
        duration = ?,
        view_count = ?
      WHERE youtube_id = ?`,
      [
        title,
        description,
        thumbnail,
        preacherId || null,
        themeId || null,
        publishedAt,
        JSON.stringify(tags || []),
        duration || 0,
        viewCount || 0,
        youtubeId
      ]
    );
    return await getVideoByYoutubeId(youtubeId);
  } else {
    // Création
    const [result] = await db.execute(
      `INSERT INTO videos (
        youtube_id, title, description, thumbnail,
        preacher_id, theme_id, published_at, tags, duration, view_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        youtubeId,
        title,
        description,
        thumbnail,
        preacherId || null,
        themeId || null,
        publishedAt,
        JSON.stringify(tags || []),
        duration || 0,
        viewCount || 0
      ]
    );
    return await getVideoById(result.insertId);
  }
};

/**
 * Récupère les vidéos suggérées (aléatoires parmi les plus récentes)
 * Récupère un pool de vidéos récentes et en sélectionne aléatoirement
 */
export const getSuggestedVideos = async (videoId, limit = 6) => {
  const video = await getVideoById(videoId);
  if (!video) return [];

  const db = getConnection();
  
  // Récupérer un pool plus large de vidéos récentes (50-100) pour avoir plus de variété
  const poolSize = Math.max(50, limit * 10);
  
  const [allVideos] = await db.execute(
    `SELECT 
      v.*,
      p.name as preacher_name,
      p.slug as preacher_slug,
      p.photo as preacher_photo,
      t.name as theme_name,
      t.slug as theme_slug
    FROM videos v
    LEFT JOIN preachers p ON v.preacher_id = p.id
    LEFT JOIN themes t ON v.theme_id = t.id
    WHERE v.id != ?
    ORDER BY v.published_at DESC
    LIMIT ?`,
    [videoId, poolSize]
  );

  if (allVideos.length === 0) return [];

  // Mélanger aléatoirement les vidéos
  const shuffled = [...allVideos];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Prendre les premières vidéos du mélange (limit)
  const selectedVideos = shuffled.slice(0, limit);

  return selectedVideos.map(formatVideo);
};

/**
 * Formate une vidéo pour la réponse API
 */
const formatVideo = (row) => {
  return {
    id: row.id,
    youtubeId: row.youtube_id,
    title: row.title,
    description: row.description,
    thumbnail: row.thumbnail,
    publishedAt: row.published_at,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
    duration: row.duration,
    viewCount: row.view_count,
    preacher: row.preacher_id ? {
      id: row.preacher_id,
      name: row.preacher_name,
      slug: row.preacher_slug,
      photo: row.preacher_photo
    } : null,
    theme: row.theme_id ? {
      id: row.theme_id,
      name: row.theme_name,
      slug: row.theme_slug,
      color: row.theme_color
    } : null
  };
};

