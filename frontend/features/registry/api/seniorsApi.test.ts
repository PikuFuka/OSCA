import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../core/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

vi.mock('../../../core/api/cache', () => ({
  withCache: (_key: string, fn: () => Promise<unknown>) => fn(),
  clearCache: vi.fn(),
  getCache: () => ({ set: vi.fn() }),
}));

import { api } from '../../../core/api/client';
import { seniorsAPI } from './seniorsApi';

describe('seniorsAPI.openDocument', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('auth_token', 'header-only-token');
    (window as any).open = vi.fn();
  });

  it('opens the server-signed url without putting the token in the address bar', async () => {
    const signed = 'http://localhost:8000/api/seniors/1/documents/2?expires=1&signature=abc';
    await seniorsAPI.openDocument({ id: 2, url: signed }, 1);

    expect(window.open).toHaveBeenCalledWith(signed, '_blank', 'noopener,noreferrer');
    // The bearer token must stay in the Authorization header, never in URLs.
    expect(localStorage.getItem('auth_token')).toBe('header-only-token');
  });

  it('falls back to an authenticated blob fetch when no signed url is present', async () => {
    const blob = new Blob(['data'], { type: 'text/plain' });
    vi.mocked(api.get).mockResolvedValue({ data: blob });
    const createSpy = vi.fn(() => 'blob:fake');
    (URL as any).createObjectURL = createSpy;
    (URL as any).revokeObjectURL = vi.fn();
    vi.useFakeTimers();

    await seniorsAPI.openDocument({ id: 7 }, 3);

    expect(api.get).toHaveBeenCalledWith('/seniors/3/documents/7', { responseType: 'blob' });
    expect(window.open).toHaveBeenCalledWith('blob:fake', '_blank', 'noopener,noreferrer');
    vi.useRealTimers();
  });
});
