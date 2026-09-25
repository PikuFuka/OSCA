import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    create: vi.fn(() => ({
      defaults: {},
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

vi.mock('../../../core/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../core/api/client')>();
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  };
});

import axios from 'axios';
import { api } from '../../../core/api/client';
import { authAPI } from './authApi';
import { clearCache } from '../../../core/api/cache';

describe('authAPI', () => {
  beforeEach(() => {
    clearCache();
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(axios.get).mockResolvedValue({});
  });

  it('login stores the token on success', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { token: 'tok123', user: { id: 1 } } });

    const result = await authAPI.login('admin', 'secret');

    expect(axios.get).toHaveBeenCalled();
    expect(api.post).toHaveBeenCalledWith('/login', { identifier: 'admin', password: 'secret' });
    expect(localStorage.getItem('auth_token')).toBe('tok123');
    expect(result.token).toBe('tok123');
  });

  it('logout clears the token even when the request fails', async () => {
    localStorage.setItem('auth_token', 'tok123');
    vi.mocked(api.post).mockRejectedValue(new Error('network'));

    await authAPI.logout();

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(api.post).toHaveBeenCalledWith('/logout', {}, expect.anything());
  });
});
