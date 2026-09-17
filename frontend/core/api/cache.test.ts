import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withCache, clearCache, CACHE_DURATION, CACHE_MAX_ENTRIES } from './cache';

describe('withCache', () => {
  beforeEach(() => {
    clearCache();
    vi.useFakeTimers();
  });

  it('returns cached data without re-fetching inside the TTL', async () => {
    const fetcher = vi.fn().mockResolvedValue({ rows: [1] });

    await expect(withCache('k', fetcher)).resolves.toEqual({ rows: [1] });
    await expect(withCache('k', fetcher)).resolves.toEqual({ rows: [1] });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('re-fetches after the TTL expires', async () => {
    const fetcher = vi.fn().mockResolvedValue('v');
    await withCache('k', fetcher);
    vi.advanceTimersByTime(CACHE_DURATION + 1);
    await withCache('k', fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('dedupes concurrent requests for the same key', async () => {
    let release!: (v: string) => void;
    const gate = new Promise<string>((resolve) => { release = resolve; });
    const fetcher = vi.fn().mockReturnValue(gate);

    const a = withCache('k', fetcher);
    const b = withCache('k', fetcher);
    release('shared');
    await expect(a).resolves.toBe('shared');
    await expect(b).resolves.toBe('shared');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('evicts the least-recently-used entry past the cap', async () => {
    const fetcher = vi.fn().mockImplementation((k: string) => Promise.resolve(k));
    for (let i = 0; i < CACHE_MAX_ENTRIES; i++) {
      await withCache(`k${i}`, () => fetcher(`k${i}`));
    }
    // Touch k0 so k1 becomes the LRU victim.
    await withCache('k0', () => fetcher('k0'));
    await withCache('overflow', () => fetcher('overflow'));

    const before = fetcher.mock.calls.length;
    await withCache('k1', () => fetcher('k1'));
    expect(fetcher.mock.calls.length).toBe(before + 1); // evicted -> refetch
    await withCache('k0', () => fetcher('k0'));
    expect(fetcher.mock.calls.length).toBe(before + 1); // retained -> cache hit
  });

  it('forceRefresh bypasses the cache and stores the fresh value', async () => {
    const fetcher = vi.fn().mockResolvedValue('fresh');
    await withCache('k', fetcher);
    await withCache('k', fetcher, { forceRefresh: true });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
