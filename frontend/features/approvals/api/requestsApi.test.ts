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
import { requestsAPI } from './requestsApi';
import { clearCache } from '../../../core/api/cache';

describe('requestsAPI.getPending', () => {
  beforeEach(() => {
    clearCache();
    vi.clearAllMocks();
  });

  it('requests the correct page params', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { total: 0 } });

    const result = await requestsAPI.getPending(2, 10);

    expect(api.get).toHaveBeenCalledWith('/requests', { params: { page: 2, per_page: 10 } });
    expect(result).toEqual({ total: 0 });
  });

  it('uses a distinct cache key per page and caches repeats', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: 'page1' });

    await requestsAPI.getPending(1, 15);
    await requestsAPI.getPending(1, 15);

    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('fresh option bypasses the cache', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: 'v1' }).mockResolvedValueOnce({ data: 'v2' });

    await requestsAPI.getPending(1, 15);
    const second = await requestsAPI.getPending(1, 15, { fresh: true });

    expect(second).toBe('v2');
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});

describe('requestsAPI.approve', () => {
  beforeEach(() => {
    clearCache();
    vi.clearAllMocks();
  });

  it('calls the approve endpoint with osca_id when provided', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { ok: true } });

    await requestsAPI.approve(5, 'OSCA-001');

    expect(api.put).toHaveBeenCalledWith('/requests/5/approve', { osca_id: 'OSCA-001' });
  });
});
