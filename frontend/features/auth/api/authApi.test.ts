import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../core/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  API_BASE_URL: '/api',
}));

vi.mock('../../../core/api/cache', () => ({
  withCache: (_key: string, fn: () => Promise<unknown>) => fn(),
  clearCache: vi.fn(),
  deleteCache: vi.fn(),
}));

import { api } from '../../../core/api/client';
import { authAPI } from './authApi';

describe('authAPI.changePassword', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('auth_token', 'old-token');
  });

  it('drops the local token and signals re-login (server revokes all sessions)', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, reauthenticate: true } });
    const events: string[] = [];
    const listener = () => events.push('auth-unauthorized');
    window.addEventListener('auth-unauthorized', listener);

    await authAPI.changePassword('OldPass123!', 'NewPass123!', 'NewPass123!');

    expect(api.post).toHaveBeenCalledWith('/change-password', {
      current_password: 'OldPass123!',
      new_password: 'NewPass123!',
      new_password_confirmation: 'NewPass123!',
    });
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(events).toContain('auth-unauthorized');
    window.removeEventListener('auth-unauthorized', listener);
  });
});
