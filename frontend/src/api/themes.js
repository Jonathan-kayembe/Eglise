import client from './client.js';

export const getAllThemes = async () => {
  const response = await client.get('/themes');
  return response.data.themes;
};

export const getThemeBySlug = async (slug) => {
  const response = await client.get(`/themes/${slug}`);
  return response.data;
};

export const getThemeVideos = async (slug, params = {}) => {
  const response = await client.get(`/themes/${slug}/videos`, { params });
  return response.data;
};

