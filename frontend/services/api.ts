import axios from 'axios';

// API Service - Connects Frontend to Laravel Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Token management functions (Removed - Laravel Sanctum SPA auth used instead)
 */

// Create a configured axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// axios interceptor to attach Bearer token to every request
api.defaults.withCredentials = true;

// Add request interceptor to attach token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// axios interceptor to show a response immediately without artificial delay
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Transform error for better UI display
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).status = error.response?.status;
    (enhancedError as any).data = error.response?.data;
    
    // If unauthorized (401), clear token and potentially redirect
    if (error.response?.status === 401) {
      // Don't trigger auto-logout if the error came from a login attempt
      const isLoginRequest = error.config?.url?.includes('/login');
      
      const currentToken = localStorage.getItem('auth_token');
      if (currentToken && !isLoginRequest) {
        console.warn('Unauthorized error (401) detected. Clearing expired token.');
        localStorage.removeItem('auth_token');
        // Optional: Trigger a page reload or event to notify AuthProvider
        window.dispatchEvent(new Event('auth-unauthorized'));
      }
    }
    
    return Promise.reject(enhancedError);
  }
);

// Simple in-memory cache for API requests
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Cache helper to wrap API calls with simple caching
 */
const withCache = async (
  key: string,
  fetcher: () => Promise<any>,
  options?: { forceRefresh?: boolean }
) => {
  const cached = cache.get(key);
  if (!options?.forceRefresh && cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
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
    // Pre-flight request for Sanctum CSRF cookie
    const baseURL = API_BASE_URL.replace('/api', '');
    try {
      await axios.get(`${baseURL}/sanctum/csrf-cookie`, { withCredentials: true });
    } catch (e) {
      console.warn('CSRF cookie pre-flight failed', e);
    }
    
    const response = await api.post('/login', { identifier, password });
    
    // Store token if returned (fallback for Sanctum Session issues)
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    
    return response.data;
  },

  logout: async () => {
    // Reset cache on logout
    cache.clear();
    const token = localStorage.getItem('auth_token');
    localStorage.removeItem('auth_token');
    
    try {
      // If we had a token, ensure it's used for the logout request
      // even if interceptors were already cleared
      await api.post('/logout', {}, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
    } catch (error) {
      console.warn('Logout request failed, cleaning up local state anyway', error);
    }
  },

  getCurrentUser: async () => {
    return withCache('user-me', async () => {
      const response = await api.get('/me');
      return response.data;
    });
  },

  changePassword: async (currentPassword: string, newPassword: string, newPasswordConfirmation: string) => {
    const response = await api.post('/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPasswordConfirmation,
    });
    cache.delete('user-me');
    return response.data;
  },

  register: async (seniorData: any, files?: { [key: string]: File }) => {
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

    const response = await api.post('/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    cache.clear(); // Clear cache after public registration
    return response.data;
  },
};

// Seniors API
export const seniorsAPI = {
  clearCache: () => cache.clear(),

  getAll: async (params?: any) => {
    const requestParams = { ...(params || {}) };
    const forceRefresh = Boolean(requestParams.fresh);
    delete requestParams.fresh;

    const key = `seniors-all-${JSON.stringify(requestParams)}`;
    return withCache(key, async () => {
      const response = await api.get('/seniors', { params: requestParams } as any);
      return response.data;
    }, { forceRefresh });
  },

  getById: async (id: number | string) => {
    return withCache(`senior-detail-${id}`, async () => {
      const response = await api.get(`/seniors/${id}`);
      return response.data;
    });
  },

  // Same as getById but always fetches fresh (bypasses cache)
  getByIdFresh: async (id: number | string) => {
    const response = await api.get(`/seniors/${id}`);
    // Update cache too so other components benefit
    cache.set(`senior-detail-${id}`, { data: response.data, timestamp: Date.now() });
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
    cache.clear(); // Clear cache after new member is created
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
    const response = await api.get(`/seniors/${seniorId}/documents/${documentId}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  getDocumentUrl: (seniorId: number | string, documentId: number | string): string => {
    const base = API_BASE_URL.startsWith('http') ? API_BASE_URL : `${window.location.origin}${API_BASE_URL}`;
    const token = localStorage.getItem('auth_token');
    const url = `${base}/seniors/${seniorId}/documents/${documentId}`;
    // Append token for "Open in New Tab" functionality where headers aren't sent
    return token ? `${url}?token=${token}` : url;
  },

  getNextOscaId: async () => {
    const response = await api.get('/seniors/next-id', { skipDelay: true } as any);
    return response.data;
  },
};

// Requests API
export const requestsAPI = {
  getPending: async (page = 1, perPage = 15) => {
    return withCache(`requests-pending-${page}-${perPage}`, async () => {
      const response = await api.get('/requests', {
        params: {
          page,
          per_page: perPage,
        },
      });
      return response.data;
    });
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
    cache.clear();
    return response.data;
  },

  approve: async (id: number, oscaId?: string) => {
    const response = await api.put(`/requests/${id}/approve`, oscaId ? { osca_id: oscaId } : {});
    cache.clear();
    return response.data;
  },

  reject: async (id: number, reason?: string) => {
    const response = await api.put(`/requests/${id}/reject`, { reason });
    cache.clear();
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getAll: async () => {
    return withCache('users-all', async () => {
      const response = await api.get('/users');
      return response.data;
    });
  },

  create: async (userData: any) => {
    const response = await api.post('/users', userData);
    cache.clear();
    return response.data;
  },

  update: async (id: number, userData: any) => {
    const response = await api.put(`/users/${id}`, userData);
    cache.clear();
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    cache.clear();
    return response.data;
  },
};

// Activity Logs API
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
    cache.clear();
    return response.data;
  },

  log: async (logData: any) => {
    const response = await api.post('/activity-logs', logData);
    cache.clear();
    return response.data;
  }
};

// Backup API
export const backupAPI = {
  exportDB: async (): Promise<Blob> => {
    const response = await api.get('/backup/export', { responseType: 'blob' });
    return response.data;
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
    // Deprecated for direct links: Use downloadSeniorCitizensReport instead
    const searchParams = new URLSearchParams();
    if (params?.barangay) searchParams.append('barangay', params.barangay);
    if (params?.year) searchParams.append('year', String(params.year));
    
    // Add auth token to URL if present
    const token = localStorage.getItem('auth_token');
    if (token) {
      searchParams.append('token', token);
    }

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
