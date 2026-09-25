import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import { api } from '../../../core/api/client';
import { seniorsAPI } from './seniorsApi';
import { clearCache } from '../../../core/api/cache';

describe('seniorsAPI.getAll', () => {
  beforeEach(() => {
    clearCache();
    vi.clearAllMocks();
  });

  it('builds correct params and strips fresh/signal', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { total: 1 } });
    const controller = new AbortController();

    const result = await seniorsAPI.getAll({
      barangay: 'Anibong',
      page: 2,
      fresh: true,
      signal: controller.signal,
    });

    expect(api.get).toHaveBeenCalledWith(
      '/seniors',
      { params: { barangay: 'Anibong', page: 2 }, signal: controller.signal }
    );
    expect(result).toEqual({ total: 1 });
  });

  it('caches repeated calls with the same params', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: 'v1' });

    await seniorsAPI.getAll({ barangay: 'X' });
    await seniorsAPI.getAll({ barangay: 'X' });

    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('forceRefresh via fresh bypasses the cache', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: 'v1' }).mockResolvedValueOnce({ data: 'v2' });

    const first = await seniorsAPI.getAll({ barangay: 'Y' });
    const second = await seniorsAPI.getAll({ barangay: 'Y', fresh: true });

    expect(first).toBe('v1');
    expect(second).toBe('v2');
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});

describe('seniorsAPI.getDocumentUrl', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('includes token when logged in', () => {
    localStorage.setItem('auth_token', 'tok123');
    const url = seniorsAPI.getDocumentUrl(1, 2);
    expect(url).toContain('/seniors/1/documents/2');
    expect(url).toContain('token=tok123');
  });
});
