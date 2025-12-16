import { getConnection } from '../config/database.js';

/**
 * Formate une playlist pour la réponse API
 */
const formatPlaylist = (playlist) => {
  return {
    id: playlist.id,
    name: playlist.name,
    slug: playlist.slug,
    description: playlist.description,
    thumbnail: playlist.thumbnail,
    type: playlist.type,
    referenceId: playlist.reference_id,
    isFeatured: playlist.is_featured === 1 || playlist.is_featured === true,
    sortOrder: playlist.sort_order,
    videoCount: playlist.video_count || 0,
    updatedAt: playlist.updated_at
  };
};

/**
 * Récupère toutes les playlists
 */
export const getAllPlaylists = async (options = {}) => {
  const { featured = false, type = null } = options;
  const db = getConnection();

  let query = `
    SELECT 
      p.*,
      COUNT(pv.video_id) as video_count
    FROM playlists p
    LEFT JOIN playlist_videos pv ON p.id = pv.playlist_id
  `;

  const conditions = [];
  const params = [];

  if (featured) {
    conditions.push('p.is_featured = ?');
    params.push(1);
  }

  if (type) {
    conditions.push('p.type = ?');
    params.push(type);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += `
    GROUP BY p.id
    ORDER BY p.sort_order ASC, p.name ASC
  `;

  const [playlists] = await db.execute(query, params);
  return playlists.map(formatPlaylist);
};

/**
 * Récupère une playlist par slug
 */
export const getPlaylistBySlug = async (slug) => {
  const db = getConnection();

  const [playlists] = await db.execute(
    `SELECT 
      p.*,
      COUNT(pv.video_id) as video_count
    FROM playlists p
    LEFT JOIN playlist_videos pv ON p.id = pv.playlist_id
    WHERE p.slug = ?
    GROUP BY p.id`,
    [slug]
  );

  if (playlists.length === 0) {
    return null;
  }

  return formatPlaylist(playlists[0]);
};

/**
 * Récupère les vidéos d'une playlist
 */
export const getPlaylistVideos = async (playlistId, options = {}) => {
  const { limit = 50, page = 1 } = options;
  const offset = (page - 1) * limit;
  const db = getConnection();

  const [videos] = await db.execute(
    `SELECT 
      v.*,
      p.name as preacher_name,
      p.slug as preacher_slug,
      p.photo as preacher_photo,
      t.name as theme_name,
      t.slug as theme_slug,
      t.color as theme_color,
      pv.position
    FROM playlist_videos pv
    INNER JOIN videos v ON pv.video_id = v.id
    LEFT JOIN preachers p ON v.preacher_id = p.id
    LEFT JOIN themes t ON v.theme_id = t.id
    WHERE pv.playlist_id = ?
    ORDER BY pv.position ASC, v.published_at DESC
    LIMIT ? OFFSET ?`,
    [playlistId, limit, offset]
  );

  const [countResult] = await db.execute(
    `SELECT COUNT(*) as total 
    FROM playlist_videos 
    WHERE playlist_id = ?`,
    [playlistId]
  );

  const formatVideo = (v) => ({
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
    } : null,
    theme: v.theme_name ? {
      name: v.theme_name,
      slug: v.theme_slug,
      color: v.theme_color
    } : null
  });

  return {
    videos: videos.map(formatVideo),
    pagination: {
      page,
      limit,
      total: countResult[0].total,
      totalPages: Math.ceil(countResult[0].total / limit)
    }
  };
};

/**
 * Crée ou met à jour une playlist automatique basée sur un prédicateur
 */
export const createPreacherPlaylist = async (preacherId) => {
  const db = getConnection();

  // Récupérer le prédicateur
  const [preachers] = await db.execute(
    'SELECT * FROM preachers WHERE id = ?',
    [preacherId]
  );

  if (preachers.length === 0) {
    throw new Error('Prédicateur non trouvé');
  }

  const preacher = preachers[0];
  const slug = `preacher-${preacher.slug}`;

  // Vérifier si la playlist existe déjà
  const [existing] = await db.execute(
    'SELECT * FROM playlists WHERE slug = ?',
    [slug]
  );

  let playlistId;
  let thumbnail = preacher.photo;

  if (existing.length > 0) {
    playlistId = existing[0].id;
    // Mettre à jour la date de modification
    await db.execute(
      'UPDATE playlists SET updated_at = NOW() WHERE id = ?',
      [playlistId]
    );
  } else {
    // Récupérer la première vidéo pour la thumbnail
    const [firstVideo] = await db.execute(
      'SELECT thumbnail FROM videos WHERE preacher_id = ? ORDER BY published_at DESC LIMIT 1',
      [preacherId]
    );
    if (firstVideo && firstVideo.thumbnail) {
      thumbnail = firstVideo.thumbnail;
    }

    // Créer la playlist
    const [result] = await db.execute(
      `INSERT INTO playlists (name, slug, description, thumbnail, type, reference_id)
       VALUES (?, ?, ?, ?, 'preacher', ?)`,
      [
        `Frère/Brother ${preacher.name}`,
        slug,
        `Prédications de ${preacher.name}`,
        thumbnail,
        preacherId
      ]
    );
    playlistId = result.insertId;
  }

  // Supprimer toutes les vidéos existantes de la playlist
  await db.execute(
    'DELETE FROM playlist_videos WHERE playlist_id = ?',
    [playlistId]
  );

  // Ajouter toutes les vidéos du prédicateur à la playlist
  const [videos] = await db.execute(
    'SELECT id FROM videos WHERE preacher_id = ? ORDER BY published_at DESC',
    [preacherId]
  );

  for (let i = 0; i < videos.length; i++) {
    await db.execute(
      'INSERT INTO playlist_videos (playlist_id, video_id, position) VALUES (?, ?, ?)',
      [playlistId, videos[i].id, i]
    );
  }

  // Mettre à jour la thumbnail si nécessaire (première vidéo)
  if (videos.length > 0) {
    const [firstVideo] = await db.execute(
      'SELECT thumbnail FROM videos WHERE id = ?',
      [videos[0].id]
    );
    if (firstVideo && firstVideo.thumbnail) {
      await db.execute(
        'UPDATE playlists SET thumbnail = ? WHERE id = ?',
        [firstVideo.thumbnail, playlistId]
      );
    }
  }

  return await getPlaylistBySlug(slug);
};

/**
 * Crée ou met à jour une playlist automatique basée sur un thème
 */
export const createThemePlaylist = async (themeId) => {
  const db = getConnection();

  // Récupérer le thème
  const [themes] = await db.execute(
    'SELECT * FROM themes WHERE id = ?',
    [themeId]
  );

  if (themes.length === 0) {
    throw new Error('Thème non trouvé');
  }

  const theme = themes[0];
  const slug = `theme-${theme.slug}`;

  // Vérifier si la playlist existe déjà
  const [existing] = await db.execute(
    'SELECT * FROM playlists WHERE slug = ?',
    [slug]
  );

  let playlistId;
  let thumbnail = null;

  if (existing.length > 0) {
    playlistId = existing[0].id;
    // Mettre à jour la date de modification
    await db.execute(
      'UPDATE playlists SET updated_at = NOW() WHERE id = ?',
      [playlistId]
    );
  } else {
    // Récupérer la première vidéo pour la thumbnail
    const [firstVideo] = await db.execute(
      'SELECT thumbnail FROM videos WHERE theme_id = ? ORDER BY published_at DESC LIMIT 1',
      [themeId]
    );
    if (firstVideo && firstVideo.thumbnail) {
      thumbnail = firstVideo.thumbnail;
    }

    // Créer la playlist
    const [result] = await db.execute(
      `INSERT INTO playlists (name, slug, description, thumbnail, type, reference_id)
       VALUES (?, ?, ?, ?, 'theme', ?)`,
      [
        theme.name,
        slug,
        theme.description || `Prédications sur le thème ${theme.name}`,
        thumbnail,
        themeId
      ]
    );
    playlistId = result.insertId;
  }

  // Supprimer toutes les vidéos existantes de la playlist
  await db.execute(
    'DELETE FROM playlist_videos WHERE playlist_id = ?',
    [playlistId]
  );

  // Ajouter toutes les vidéos du thème à la playlist
  const [videos] = await db.execute(
    'SELECT id FROM videos WHERE theme_id = ? ORDER BY published_at DESC',
    [themeId]
  );

  for (let i = 0; i < videos.length; i++) {
    await db.execute(
      'INSERT INTO playlist_videos (playlist_id, video_id, position) VALUES (?, ?, ?)',
      [playlistId, videos[i].id, i]
    );
  }

  // Mettre à jour la thumbnail si nécessaire (première vidéo)
  if (videos.length > 0) {
    const [firstVideo] = await db.execute(
      'SELECT thumbnail FROM videos WHERE id = ?',
      [videos[0].id]
    );
    if (firstVideo && firstVideo.thumbnail) {
      await db.execute(
        'UPDATE playlists SET thumbnail = ? WHERE id = ?',
        [firstVideo.thumbnail, playlistId]
      );
    }
  }

  return await getPlaylistBySlug(slug);
};

/**
 * Synchronise toutes les playlists automatiques (prédicateurs et thèmes)
 */
export const syncAutoPlaylists = async () => {
  const db = getConnection();

  let created = 0;
  let updated = 0;
  let errors = 0;

  // Créer/mettre à jour des playlists pour tous les prédicateurs
  const [preachers] = await db.execute('SELECT id FROM preachers');
  console.log(`📋 Synchronisation de ${preachers.length} playlists pour les prédicateurs...`);
  
  for (const preacher of preachers) {
    try {
      // Récupérer le slug du prédicateur
      const [preacherData] = await db.execute(
        'SELECT slug FROM preachers WHERE id = ?',
        [preacher.id]
      );
      if (preacherData.length === 0) continue;
      
      const slug = `preacher-${preacherData[0].slug}`;
      const [existing] = await db.execute(
        'SELECT id FROM playlists WHERE slug = ?',
        [slug]
      );
      await createPreacherPlaylist(preacher.id);
      if (existing.length > 0) {
        updated++;
      } else {
        created++;
      }
    } catch (error) {
      console.error(`❌ Erreur pour le prédicateur ${preacher.id}:`, error.message);
      errors++;
    }
  }

  // Créer/mettre à jour des playlists pour tous les thèmes
  const [themes] = await db.execute('SELECT id FROM themes');
  console.log(`📋 Synchronisation de ${themes.length} playlists pour les thèmes...`);
  
  for (const theme of themes) {
    try {
      // Récupérer le slug du thème
      const [themeData] = await db.execute(
        'SELECT slug FROM themes WHERE id = ?',
        [theme.id]
      );
      if (themeData.length === 0) continue;
      
      const slug = `theme-${themeData[0].slug}`;
      const [existing] = await db.execute(
        'SELECT id FROM playlists WHERE slug = ?',
        [slug]
      );
      await createThemePlaylist(theme.id);
      if (existing.length > 0) {
        updated++;
      } else {
        created++;
      }
    } catch (error) {
      console.error(`❌ Erreur pour le thème ${theme.id}:`, error.message);
      errors++;
    }
  }

  console.log(`✅ Synchronisation terminée: ${created} créées, ${updated} mises à jour, ${errors} erreurs`);
  
  return {
    created,
    updated,
    errors,
    total: created + updated
  };
};

