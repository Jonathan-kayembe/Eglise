import client from './client.js';

export const getVideos = async (params = {}) => {
  const response = await client.get('/videos', { params });
  return response.data;
};

export const getVideoById = async (id) => {
  const response = await client.get(`/videos/${id}`);
  return response.data;
};

export const getSuggestedVideos = async (id) => {
  const response = await client.get(`/videos/${id}/suggested`);
  return response.data.videos;
};

