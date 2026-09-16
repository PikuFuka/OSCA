import { api, API_BASE_URL } from '../../../core/api/client';
import { withCache, clearCache, getCache } from '../../../core/api/cache';

export const seniorsAPI = {
  clearCache: () => clearCache(),

  getAll: async (params?: any) => {
    const requestParams = { ...(params || {}) };
    const forceRefresh = Boolean(requestParams.fresh);
    const signal = requestParams.signal as AbortSignal | undefined;
    delete requestParams.fresh;
    delete requestParams.signal;
    const key = `seniors-all-${JSON.stringify(requestParams)}`;
    return withCache(key, async () => {
      const response = await api.get('/seniors', { params: requestParams, signal } as any);
      return response.data;
    }, { forceRefresh });
  },

  getById: async (id: number | string) => {
    return withCache(`senior-detail-${id}`, async () => {
      const response = await api.get(`/seniors/${id}`);
      return response.data;
    });
  },

  getByIdFresh: async (id: number | string) => {
    const response = await api.get(`/seniors/${id}`);
    getCache().set(`senior-detail-${id}`, { data: response.data, timestamp: Date.now() });
    return response.data;
  },

  getByOscaId: async (oscaId: string) => {
    return withCache(`senior-osca-${oscaId}`, async () => {
      const response = await api.get(`/seniors/osca/${oscaId}`);
      return response.data;
    });
  },

  create: async (seniorData: any, files?: { [key: string]: File }) => {
    const formData = new FormData();
    Object.entries(seniorData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (typeof value === 'object') formData.append(key, JSON.stringify(value));
        else formData.append(key, String(value));
      }
    });
    if (files) Object.entries(files).forEach(([key, file]) => { if (file) formData.append(key, file); });
    const response = await api.post('/seniors', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    clearCache();
    return response.data;
  },

  update: async (id: number | string, seniorData: any, files?: { [key: string]: File }) => {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    Object.entries(seniorData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (typeof value === 'object') formData.append(key, JSON.stringify(value));
        else formData.append(key, String(value));
      }
    });
    if (files) Object.entries(files).forEach(([key, file]) => { if (file) formData.append(key, file); });
    clearCache();
    const response = await api.post(`/seniors/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
  },

  delete: async (id: number | string) => {
    clearCache();
    const response = await api.delete(`/seniors/${id}`);
    return response.data;
  },

  getDeleted: async () => {
    return withCache('seniors-deleted', async () => {
      const response = await api.get('/seniors/deleted');
      return response.data;
    });
  },

  getDeceased: async () => {
    return withCache('seniors-deceased', async () => {
      const response = await api.get('/seniors/deceased');
      return response.data;
    });
  },

  restore: async (id: number | string) => {
    clearCache();
    const response = await api.post(`/seniors/${id}/restore`);
    return response.data;
  },

  markDeceased: async (id: number | string, dateOfDeath: string) => {
    clearCache();
    const response = await api.post(`/seniors/${id}/deceased`, { date_of_death: dateOfDeath });
    return response.data;
  },

  unDeceased: async (id: number | string) => {
    clearCache();
    const response = await api.post(`/seniors/${id}/un-deceased`);
    return response.data;
  },

  updatePhoto: async (id: string | number, photoBase64: string) => {
    clearCache();
    const response = await api.post(`/seniors/${id}/photo`, { photo: photoBase64 });
    return response.data;
  },

  uploadDocument: async (seniorId: string | number, file: File, type: string) => {
    clearCache();
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', type);
    const response = await api.post(`/seniors/${seniorId}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
  },

  deleteDocument: async (seniorId: string | number, documentId: string | number) => {
    clearCache();
    const response = await api.delete(`/seniors/${seniorId}/documents/${documentId}`);
    return response.data;
  },

  getStatistics: async (barangay?: string, year?: string | number, options?: { fresh?: boolean }) => {
    const key = `stats-${barangay}-${year}`;
    return withCache(key, async () => {
      const params: any = {};
      if (barangay && barangay !== 'All Barangays') params.barangay = barangay;
      if (year) params.year = year;
      const response = await api.get('/seniors/statistics', { params });
      return response.data;
    }, { forceRefresh: Boolean(options?.fresh) });
  },

  viewDocument: async (seniorId: string | number, documentId: string | number) => {
    const response = await api.get(`/seniors/${seniorId}/documents/${documentId}`, { responseType: 'blob' });
    return response.data;
  },

  getDocumentUrl: (seniorId: number | string, documentId: number | string): string => {
    const base = API_BASE_URL.startsWith('http') ? API_BASE_URL : `${window.location.origin}${API_BASE_URL}`;
    const token = localStorage.getItem('auth_token');
    const url = `${base}/seniors/${seniorId}/documents/${documentId}`;
    return token ? `${url}?token=${token}` : url;
  },

  getNextOscaId: async () => {
    const response = await api.get('/seniors/next-id', { skipDelay: true } as any);
    return response.data;
  },

  getBirthdays: async () => {
    const response = await api.get('/seniors/birthdays');
    return response.data;
  },
};

export default seniorsAPI;
