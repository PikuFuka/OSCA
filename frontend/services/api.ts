import axios from 'axios';

// API Service - Connects Frontend to Laravel Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Token management functions
 */
export const getToken = (): string | null => localStorage.getItem('osca_token');
export const setToken = (token: string): void => localStorage.setItem('osca_token', token);
export const removeToken = (): void => localStorage.removeItem('osca_token');

// Create a configured axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// axios interceptor to attach Bearer token to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// axios interceptor to show a response immediately without artificial delay
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
    }
    
    // Transform error for better UI display
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).status = error.response?.status;
    (enhancedError as any).data = error.response?.data;
    
    return Promise.reject(enhancedError);
  }
);

// Simple in-memory cache for API requests
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Cache helper to wrap API calls with simple caching
 */
const withCache = async (key: string, fetcher: () => Promise<any>) => {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    // Return from cache immediately, but we could also background refresh
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

// Auth API
export const authAPI = {
  login: async (identifier: string, password: string) => {
    // Reset cache on login
    cache.clear();
    const response = await api.post('/login', { identifier, password });
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data;
  },

  logout: async () => {
    // Reset cache on logout
    cache.clear();
    try {
      if (getToken()) await api.post('/logout');
    } finally {
      removeToken();
    }
  },

  getCurrentUser: async () => {
    return withCache('user-me', async () => {
      const response = await api.get('/me');
      return response.data;
    });
  },
};

// Seniors API
export const seniorsAPI = {
  clearCache: () => cache.clear(),

  getAll: async (params?: any) => {
    const key = `seniors-all-${JSON.stringify(params || {})}`;
    return withCache(key, async () => {
      const response = await api.get('/seniors', { params } as any);
      return response.data;
    });
  },

  getById: async (id: number | string) => {
    return withCache(`senior-detail-${id}`, async () => {
      const response = await api.get(`/seniors/${id}`);
      return response.data;
    });
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
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    if (files) {
      Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });
    }

    const response = await api.post('/seniors', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  update: async (id: number | string, seniorData: any, files?: { [key: string]: File }) => {
    const formData = new FormData();
    formData.append('_method', 'PUT'); // Laravel requirement for PUT with files
    Object.entries(seniorData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    if (files) {
      Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });
    }

    cache.clear(); // Clear cache on update
    const response = await api.post(`/seniors/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  delete: async (id: number | string) => {
    cache.clear(); // Clear cache on delete
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
    cache.clear();
    const response = await api.post(`/seniors/${id}/restore`);
    return response.data;
  },

  markDeceased: async (id: number | string, dateOfDeath: string) => {
    cache.clear();
    const response = await api.post(`/seniors/${id}/deceased`, { date_of_death: dateOfDeath });
    return response.data;
  },

  unDeceased: async (id: number | string) => {
    cache.clear();
    const response = await api.post(`/seniors/${id}/un-deceased`);
    return response.data;
  },

  updatePhoto: async (id: string | number, photoBase64: string) => {
    cache.clear();
    const response = await api.post(`/seniors/${id}/photo`, { photo: photoBase64 });
    return response.data;
  },

  uploadDocument: async (seniorId: string | number, file: File, type: string) => {
    cache.clear();
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', type);
    const response = await api.post(`/seniors/${seniorId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteDocument: async (seniorId: string | number, documentId: string | number) => {
    cache.clear();
    const response = await api.delete(`/seniors/${seniorId}/documents/${documentId}`);
    return response.data;
  },

  getStatistics: async (barangay?: string, year?: string | number) => {
    const key = `stats-${barangay}-${year}`;
    return withCache(key, async () => {
      const params: any = {};
      if (barangay && barangay !== 'All Barangays') params.barangay = barangay;
      if (year) params.year = year;
      const response = await api.get('/seniors/statistics', { params });
      return response.data;
    });
  },

  viewDocument: async (seniorId: string | number, documentId: string | number) => {
    const response = await api.get(`/seniors/${seniorId}/documents/${documentId}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  getDocumentUrl: (seniorId: number | string, documentId: number | string): string => {
    const token = getToken();
    // Use window.location.origin if API_BASE_URL is relative
    const base = API_BASE_URL.startsWith('http') ? API_BASE_URL : `${window.location.origin}${API_BASE_URL}`;
    return `${base}/seniors/${seniorId}/documents/${documentId}?token=${token}`;
  },

  getNextOscaId: async () => {
    const response = await api.get('/seniors/next-id', { skipDelay: true } as any);
    return response.data;
  },
};

// Requests API
export const requestsAPI = {
  getPending: async () => {
    const response = await api.get('/requests');
    return response.data;
  },

  submitUpdate: async (formData: any, files?: { [key: string]: File }) => {
    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'confirmPassword' && value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object') {
          fd.append(key, JSON.stringify(value));
        } else {
          fd.append(key, String(value));
        }
      }
    });
    if (files) {
      Object.entries(files).forEach(([key, file]) => {
        if (file) fd.append(key, file);
      });
    }
    const response = await api.post('/requests/update', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  approve: async (id: number) => {
    const response = await api.put(`/requests/${id}/approve`);
    return response.data;
  },

  reject: async (id: number, reason?: string) => {
    const response = await api.put(`/requests/${id}/reject`, { reason });
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  create: async (userData: any) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  update: async (id: number, userData: any) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// Activity Logs API
export const activityLogsAPI = {
  getAll: async (params?: any) => {
    const response = await api.get('/activity-logs', { params });
    return response.data;
  },

  clear: async () => {
    const response = await api.delete('/activity-logs');
    return response.data;
  },

  log: async (logData: any) => {
    const response = await api.post('/activity-logs', logData);
    return response.data;
  }
};

// Backup API
export const backupAPI = {
  exportDB: (): string => {
    const token = getToken();
    return `${API_BASE_URL}/backup/export?token=${token}`; // Token as query param for direct download
  },

  importDB: async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const response = await api.post('/backup/import', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
};

// Reports API
export const reportsAPI = {
  /**
   * Get the direct download URL for the Senior Citizens Excel report.
   * Open this URL in a new tab or use it as an anchor href to trigger the download.
   */
  getSeniorCitizensReportUrl: (params?: { barangay?: string; year?: string | number }): string => {
    const token = getToken();
    const searchParams = new URLSearchParams();
    if (token) searchParams.append('token', token);
    if (params?.barangay) searchParams.append('barangay', params.barangay);
    if (params?.year) searchParams.append('year', String(params.year));
    const base = API_BASE_URL.startsWith('http') ? API_BASE_URL : `${window.location.origin}${API_BASE_URL}`;
    return `${base}/reports/senior-citizens?${searchParams.toString()}`;
  },

  /**
   * Download the Senior Citizens Excel report as a Blob (useful for programmatic handling).
   */
  downloadSeniorCitizensReport: async (params?: { barangay?: string; year?: string | number }) => {
    const response = await api.get('/reports/senior-citizens', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;
