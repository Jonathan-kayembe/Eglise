import getConnection from '../config/database.js';
import { normalizeName } from '../utils/searchUtils.js';

/**
 * Récupère tous les prédicateurs
 */
export const getAllPreachers = async () => {
  const db = getConnection();
  const [preachers] = await db.execute(
    `SELECT 
      p.*,
      COUNT(v.id) as video_count
    FROM preachers p
    LEFT JOIN videos v ON p.id = v.preacher_id
    GROUP BY p.id
    ORDER BY p.name ASC`
  );

  return preachers.map(formatPreacher);
};

/**
 * Récupère un prédicateur par slug
 */
export const getPreacherBySlug = async (slug) => {
  const db = getConnection();
  const [preachers] = await db.execute(
    `SELECT 
      p.*,
      COUNT(v.id) as video_count
    FROM preachers p
    LEFT JOIN videos v ON p.id = v.preacher_id
    WHERE p.slug = ?
    GROUP BY p.id`,
    [slug]
  );

  if (preachers.length === 0) {
    return null;
  }

  return formatPreacher(preachers[0]);
};

/**
 * Récupère un prédicateur par ID
 */
export const getPreacherById = async (id) => {
  const db = getConnection();
  const [preachers] = await db.execute(
    `SELECT 
      p.*,
      COUNT(v.id) as video_count
    FROM preachers p
    LEFT JOIN videos v ON p.id = v.preacher_id
    WHERE p.id = ?
    GROUP BY p.id`,
    [id]
  );

  if (preachers.length === 0) {
    return null;
  }

  return formatPreacher(preachers[0]);
};

/**
 * Recherche un prédicateur par nom (avec fuzzy search)
 */
export const searchPreacherByName = async (name) => {
  const db = getConnection();
  const allPreachers = await getAllPreachers();
  const normalizedSearch = normalizeName(name);
  
  // Recherche exacte d'abord
  let found = allPreachers.find(p => {
    const normalized = normalizeName(p.name);
    return normalized === normalizedSearch;
  });
  
  if (found) return found;
  
  // Recherche partielle
  found = allPreachers.find(p => {
    const normalized = normalizeName(p.name);
    return normalized.includes(normalizedSearch) || normalizedSearch.includes(normalized);
  });
  
  return found || null;
};

/**
 * Récupère les vidéos d'un prédicateur
 */
export const getPreacherVideos = async (preacherId, options = {}) => {
  const { limit = 20, page = 1 } = options;
  const offset = (page - 1) * limit;
  const db = getConnection();

  const [videos] = await db.execute(
    `SELECT 
      v.*,
      t.name as theme_name,
      t.slug as theme_slug,
      t.color as theme_color
    FROM videos v
    LEFT JOIN themes t ON v.theme_id = t.id
    WHERE v.preacher_id = ?
    ORDER BY v.published_at DESC
    LIMIT ? OFFSET ?`,
    [preacherId, limit, offset]
  );

  const [countResult] = await db.execute(
    `SELECT COUNT(*) as total FROM videos WHERE preacher_id = ?`,
    [preacherId]
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
      theme: v.theme_name ? {
        name: v.theme_name,
        slug: v.theme_slug,
        color: v.theme_color
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
 * Crée un prédicateur
 */
export const createPreacher = async (preacherData) => {
  const db = getConnection();
  const { name, slug, bio, photo, backgroundImages } = preacherData;

  const [result] = await db.execute(
    `INSERT INTO preachers (name, slug, bio, photo, background_images)
     VALUES (?, ?, ?, ?, ?)`,
    [
      name,
      slug,
      bio || null,
      photo || null,
      JSON.stringify(backgroundImages || [])
    ]
  );

  return await getPreacherBySlug(slug);
};

/**
 * Met à jour un prédicateur
 */
export const updatePreacher = async (id, preacherData) => {
  const db = getConnection();
  const { name, slug, bio, photo, backgroundImages } = preacherData;

  await db.execute(
    `UPDATE preachers 
     SET name = ?, slug = ?, bio = ?, photo = ?, background_images = ?
     WHERE id = ?`,
    [
      name,
      slug,
      bio || null,
      photo || null,
      JSON.stringify(backgroundImages || []),
      id
    ]
  );

  return await getPreacherById(id);
};

/**
 * Fusionne deux prédicateurs (garde le premier, fusionne les vidéos du second)
 */
export const mergePreachers = async (keeperId, toMergeId) => {
  const db = getConnection();
  
  // Mettre à jour toutes les vidéos
  await db.execute(
    'UPDATE videos SET preacher_id = ? WHERE preacher_id = ?',
    [keeperId, toMergeId]
  );
  
  // Supprimer le prédicateur à fusionner
  await db.execute('DELETE FROM preachers WHERE id = ?', [toMergeId]);
  
  return await getPreacherById(keeperId);
};

/**
 * Formate un prédicateur pour la réponse API
 */
const formatPreacher = (row) => {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    bio: row.bio,
    photo: row.photo,
    backgroundImages: typeof row.background_images === 'string' 
      ? JSON.parse(row.background_images) 
      : (row.background_images || []),
    videoCount: row.video_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};
