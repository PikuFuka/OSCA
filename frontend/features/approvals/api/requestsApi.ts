import { api } from '../../../core/api/client';
import { withCache, clearCache } from '../../../core/api/cache';

export const requestsAPI = {
  getPending: async (page = 1, perPage = 15, options?: { fresh?: boolean }) => {
    const key = `requests-pending-${page}-${perPage}`;
    return withCache(key, async () => {
      const response = await api.get('/requests', { params: { page, per_page: perPage } });
      return response.data;
    }, { forceRefresh: Boolean(options?.fresh) });
  },

  submitUpdate: async (formData: any, files?: { [key: string]: File }) => {
    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'confirmPassword' && value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object') fd.append(key, JSON.stringify(value));
        else fd.append(key, String(value));
      }
    });
    if (files) Object.entries(files).forEach(([key, file]) => { if (file) fd.append(key, file); });
    const response = await api.post('/requests/update', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    clearCache();
    return response.data;
  },

  approve: async (id: number, oscaId?: string) => {
    const response = await api.put(`/requests/${id}/approve`, oscaId ? { osca_id: oscaId } : {});
    clearCache();
    return response.data;
  },

  reject: async (id: number, reason?: string) => {
    const response = await api.put(`/requests/${id}/reject`, { reason });
    clearCache();
    return response.data;
  },
};

export default requestsAPI;
