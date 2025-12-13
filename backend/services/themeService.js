import getConnection from '../config/database.js';

/**
 * Récupère tous les thèmes
 */
export const getAllThemes = async () => {
  const db = getConnection();
  const [themes] = await db.execute(
    `SELECT 
      t.*,
      COUNT(v.id) as video_count
    FROM themes t
    LEFT JOIN videos v ON t.id = v.theme_id
    GROUP BY t.id
    ORDER BY t.name ASC`
  );

  return themes.map(formatTheme);
};

/**
 * Récupère un thème par slug
 */
export const getThemeBySlug = async (slug) => {
  const db = getConnection();
  const [themes] = await db.execute(
    `SELECT 
      t.*,
      COUNT(v.id) as video_count
    FROM themes t
    LEFT JOIN videos v ON t.id = v.theme_id
    WHERE t.slug = ?
    GROUP BY t.id`,
    [slug]
  );

  if (themes.length === 0) {
    return null;
  }

  return formatTheme(themes[0]);
};

/**
 * Récupère les vidéos d'un thème
 */
export const getThemeVideos = async (themeId, options = {}) => {
  const { limit = 20, page = 1 } = options;
  const offset = (page - 1) * limit;
  const db = getConnection();

  const [videos] = await db.execute(
    `SELECT 
      v.*,
      p.name as preacher_name,
      p.slug as preacher_slug,
      p.photo as preacher_photo
    FROM videos v
    LEFT JOIN preachers p ON v.preacher_id = p.id
    WHERE v.theme_id = ?
    ORDER BY v.published_at DESC
    LIMIT ? OFFSET ?`,
    [themeId, limit, offset]
  );

  const [countResult] = await db.execute(
    `SELECT COUNT(*) as total FROM videos WHERE theme_id = ?`,
    [themeId]
  );

  return {
    videos: videos.map(v => ({
      id: v.id,
      youtubeId: v.youtube_id,
      title: v.title,
      description: v.description,
      thumbnail: v.thumbnail,
      publishedAt: v.published_at,
      tags: typeof v.tags === 'string' ? JSON.parse(v.tags) : (v.tags || []),
      duration: v.duration,
      viewCount: v.view_count,
      preacher: v.preacher_name ? {
        name: v.preacher_name,
        slug: v.preacher_slug,
        photo: v.preacher_photo
      } : null
    })),
    pagination: {
      page,
      limit,
      total: countResult[0].total,
      totalPages: Math.ceil(countResult[0].total / limit)
    }
  };
};

/**
 * Crée un thème
 */
export const createTheme = async (themeData) => {
  const db = getConnection();
  const { name, slug, description, color } = themeData;

  const [result] = await db.execute(
    `INSERT INTO themes (name, slug, description, color)
     VALUES (?, ?, ?, ?)`,
    [name, slug, description || null, color || '#D4B98A']
  );

  return await getThemeBySlug(slug);
};

/**
 * Formate un thème pour la réponse API
 */
const formatTheme = (row) => {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    color: row.color,
    videoCount: row.video_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

