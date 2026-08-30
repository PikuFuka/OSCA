import { api } from '../../core/api/client';
import { withCache, clearCache } from '../../core/api/cache';

export const activityLogsAPI = {
  getAll: async (params?: any) => {
    const key = `activity-logs-${JSON.stringify(params || {})}`;
    return withCache(key, async () => {
      const response = await api.get('/activity-logs', { params });
      return response.data;
    });
  },
  clear: async () => {
    const response = await api.delete('/activity-logs');
    clearCache();
    return response.data;
  },
  log: async (logData: any) => {
    const response = await api.post('/activity-logs', logData);
    clearCache();
    return response.data;
  },
};

export default activityLogsAPI;
