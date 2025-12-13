import client from './client.js';

export const search = async (query, params = {}) => {
  const response = await client.get('/search', {
    params: { q: query, ...params }
  });
  return response.data;
};

