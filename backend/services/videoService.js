import getConnection from '../config/database.js';

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
  if (q) {
    const searchTerm = `%${q}%`;
    // Recherche dans titre, description, nom du prédicateur, nom du thème, date formatée, et tags
    // Les JOINs sont toujours présents dans la requête principale, donc p.name et t.name sont disponibles
    conditions.push(`(
      LOWER(v.title) LIKE LOWER(?)
      OR LOWER(v.description) LIKE LOWER(?)
      OR LOWER(p.name) LIKE LOWER(?)
      OR LOWER(t.name) LIKE LOWER(?)
      OR DATE_FORMAT(v.published_at, '%d/%m/%Y') LIKE ?
      OR DATE_FORMAT(v.published_at, '%Y-%m-%d') LIKE ?
      OR DATE_FORMAT(v.published_at, '%d-%m-%Y') LIKE ?
      OR DATE_FORMAT(v.published_at, '%d %B %Y') LIKE ?
      OR DATE_FORMAT(v.published_at, '%B %Y') LIKE ?
      OR DATE_FORMAT(v.published_at, '%Y') LIKE ?
      OR DATE_FORMAT(v.published_at, '%m/%Y') LIKE ?
      OR DATE_FORMAT(v.published_at, '%m-%Y') LIKE ?
      OR DATE_FORMAT(v.published_at, '%B') LIKE LOWER(?)
      OR (v.tags IS NOT NULL AND LOWER(v.tags) LIKE LOWER(?))
    )`);
    params.push(
      searchTerm, // v.title
      searchTerm, // v.description
      searchTerm, // p.name
      searchTerm, // t.name
      searchTerm, // date format 1: dd/mm/yyyy
      searchTerm, // date format 2: yyyy-mm-dd
      searchTerm, // date format 3: dd-mm-yyyy
      searchTerm, // date format 4: dd Month yyyy
      searchTerm, // date format 5: Month yyyy
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
 * Récupère les vidéos suggérées (même prédicateur ou thème)
 */
export const getSuggestedVideos = async (videoId, limit = 6) => {
  const video = await getVideoById(videoId);
  if (!video) return [];

  const db = getConnection();
  const [videos] = await db.execute(
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
      AND (v.preacher_id = ? OR v.theme_id = ?)
    ORDER BY v.published_at DESC
    LIMIT ?`,
    [videoId, video.preacher?.id || 0, video.theme?.id || 0, limit]
  );

  return videos.map(formatVideo);
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

