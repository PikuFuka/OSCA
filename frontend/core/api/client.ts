import axios from 'axios';

// Core API client - single axios instance for the whole app (modular: features import from here)
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const TECHNICAL_MESSAGE_PATTERN = /(sqlstate|stack trace|exception|typeerror|syntaxerror|referenceerror|undefined|null|token|csrf|axios|network error|http\s*\d{3}|status\s*\d{3})/i;

export const getFriendlyErrorByStatus = (status?: number) => {
  if (status === 400) return 'Please check the information and try again.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to do that action.';
  if (status === 404) return 'The requested record was not found.';
  if (status === 422) return 'Some information is invalid. Please review and try again.';
  if (status === 500) return 'Server is temporarily unavailable. Please try again in a moment.';
  return 'Something went wrong. Please try again.';
};

/**
 * Build a browser-usable URL for an authenticated backend resource
 * (profile photos, documents). <img>/<a> tags cannot send Authorization
 * headers, so the stored token is appended as ?token= — the same mechanism
 * the backend explicitly supports for these media routes. data:/blob: URLs
 * pass through untouched. Returns '' for empty input.
 */
export const authedUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  // Backend media paths are already root-absolute (they start with /api/).
  // Resolve those against the page origin exactly like the browser would —
  // prepending API_BASE_URL again would build /api/api/... URLs that 404.
  // Bare filenames/relative paths are resolved against the API base instead.
  const absolute =
    url.startsWith('http') || url.startsWith('/api/')
      ? url.startsWith('http')
        ? url
        : `${window.location.origin}${url}`
      : `${API_BASE_URL.startsWith('http') ? API_BASE_URL : `${window.location.origin}${API_BASE_URL}`}${url.startsWith('/') ? url : `/${url}`}`;
  const token = localStorage.getItem('auth_token');
  return token ? `${absolute}${absolute.includes('?') ? '&' : '?'}token=${token}` : absolute;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  // No request may hang forever: a hung flight held skeletons on screen
  // indefinitely (notably under rapid refresh / view switching).
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

api.defaults.withCredentials = true;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const rawMessage: string = error?.message || '';
    const isCanceled = error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError' || rawMessage === 'canceled' || error?.__CANCEL__ === true;
    if (isCanceled) {
      const cancelError: any = new Error('canceled');
      cancelError.name = 'CanceledError';
      cancelError.code = 'ERR_CANCELED';
      cancelError.config = error.config;
      return Promise.reject(cancelError);
    }

    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;
    const isServerMessageSafe = typeof serverMessage === 'string' && !TECHNICAL_MESSAGE_PATTERN.test(serverMessage);
    const fallbackMessage = getFriendlyErrorByStatus(status);
    const errorMessage = isServerMessageSafe ? serverMessage : fallbackMessage;

    if (!isServerMessageSafe) {
      console.error('API request failed:', {
        status,
        method: error.config?.method,
        url: error.config?.url,
        serverMessage,
        rawError: error,
      });
    }

    const enhancedError = new Error(errorMessage);
    (enhancedError as any).status = status;
    (enhancedError as any).data = error.response?.data;

    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/login');
      const currentToken = localStorage.getItem('auth_token');
      if (currentToken && !isLoginRequest) {
        console.warn('Unauthorized error (401) detected. Clearing expired token.');
        localStorage.removeItem('auth_token');
        window.dispatchEvent(new Event('auth-unauthorized'));
      }
    }

    return Promise.reject(enhancedError);
  }
);

export default api;
export { TECHNICAL_MESSAGE_PATTERN };
