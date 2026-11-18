import { api } from '../../../core/api/client';
import { withCache, clearCache } from '../../../core/api/cache';

export const usersAPI = {
  getAll: async (params?: any) => {
    const key = `users-all-${JSON.stringify(params || {})}`;
    return withCache(key, async () => {
      const response = await api.get('/users', { params });
      return response.data;
    });
  },
  create: async (userData: any) => {
    const response = await api.post('/users', userData);
    clearCache();
    return response.data;
  },
  update: async (id: number, userData: any) => {
    const response = await api.put(`/users/${id}`, userData);
    clearCache();
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    clearCache();
    return response.data;
  },
};

export default usersAPI;
