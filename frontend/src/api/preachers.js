import client from './client.js';

export const getAllPreachers = async () => {
  const response = await client.get('/preachers');
  return response.data.preachers;
};

export const getPreacherBySlug = async (slug) => {
  const response = await client.get(`/preachers/${slug}`);
  return response.data;
};

export const getPreacherVideos = async (slug, params = {}) => {
  const response = await client.get(`/preachers/${slug}/videos`, { params });
  return response.data;
};

