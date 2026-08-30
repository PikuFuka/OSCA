// Core API — single source of truth for axios + cache (modular: features import from @/core/api)
export { api, API_BASE_URL, getFriendlyErrorByStatus } from './client';
export { withCache, clearCache, deleteCache, getCache, CACHE_DURATION } from './cache';
export { default } from './client';
