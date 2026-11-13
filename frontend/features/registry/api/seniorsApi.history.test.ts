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

describe('seniorsAPI history', () => {
  beforeEach(() => {
    clearCache();
    vi.clearAllMocks();
  });

  it('fetches a senior history from the member endpoint', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [{ action: 'UPDATED_SENIOR' }] } });

    const result = await seniorsAPI.getHistory('OSCA-1');

    expect(api.get).toHaveBeenCalledWith('/seniors/OSCA-1/history');
    expect(result).toEqual({ data: [{ action: 'UPDATED_SENIOR' }] });
  });

  it('records a new ID request with reason and notes', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } });

    await seniorsAPI.requestNewId('OSCA-1', { reason: 'Lost ID', notes: 'Lost wallet' });

    expect(api.post).toHaveBeenCalledWith('/seniors/OSCA-1/id-request', {
      reason: 'Lost ID',
      notes: 'Lost wallet',
    });
  });

  it('omits empty notes when recording a new ID request', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } });

    await seniorsAPI.requestNewId('OSCA-1', { reason: 'Damaged ID' });

    expect(api.post).toHaveBeenCalledWith('/seniors/OSCA-1/id-request', {
      reason: 'Damaged ID',
    });
  });
});
