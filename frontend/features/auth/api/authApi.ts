import axios from 'axios';
import { api, API_BASE_URL } from '../../../core/api/client';
import { withCache, clearCache, deleteCache } from '../../../core/api/cache';

// Auth — login, logout, me, password, public register
export const authAPI = {
  login: async (identifier: string, password: string) => {
    clearCache();
    const baseURL = API_BASE_URL.replace('/api', '');
    try {
      await axios.get(`${baseURL}/sanctum/csrf-cookie`, { withCredentials: true });
    } catch (e) {
      console.warn('CSRF cookie pre-flight failed', e);
    }
    const response = await api.post('/login', { identifier, password });
    if (response.data.token) localStorage.setItem('auth_token', response.data.token);
    return response.data;
  },

  logout: async () => {
    clearCache();
    const token = localStorage.getItem('auth_token');
    localStorage.removeItem('auth_token');
    try {
      await api.post('/logout', {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
    // The server revokes ALL tokens on password change, so the current token
    // is dead as of this response: drop local auth state and force sign-in.
    localStorage.removeItem('auth_token');
    clearCache();
    window.dispatchEvent(new Event('auth-unauthorized'));
    return response.data;
  },

  register: async (seniorData: any, files?: { [key: string]: File }) => {
    const formData = new FormData();
    Object.entries(seniorData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (typeof value === 'object') formData.append(key, JSON.stringify(value));
        else formData.append(key, String(value));
      }
    });
    if (files) Object.entries(files).forEach(([key, file]) => { if (file) formData.append(key, file); });
    const response = await api.post('/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    clearCache();
    return response.data;
  },
};

export default authAPI;
