// LEGACY BARREL — kept for backward compat
// New code should import from @/core/api/client or @/features/*/api/*
// This file now re-exports the modular implementations to avoid breaking existing imports

export { api, API_BASE_URL, getFriendlyErrorByStatus } from '../core/api/client';
export { withCache, clearCache, deleteCache, getCache, CACHE_DURATION } from '../core/api/cache';
export { default } from '../core/api/client';

export { authAPI } from '../features/auth/api/authApi';
export { seniorsAPI } from '../features/registry/api/seniorsApi';
export { requestsAPI } from '../features/approvals/api/requestsApi';
export { usersAPI } from '../features/accounts/api/usersApi';
export { default as activityLogsAPI } from '../shared/api/activityLogsApi';
export { default as backupAPI } from '../shared/api/backupApi';
export { reportsAPI } from '../features/reports/api/reportsApi';
