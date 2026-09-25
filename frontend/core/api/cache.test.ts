import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withCache, clearCache, getCache } from './cache';

const deferred = <T,>() => {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('withCache request collapsing', () => {
  beforeEach(() => {
    clearCache();
  });

  it('shares one in-flight request between concurrent callers', async () => {
    const gate = deferred<string>();
    const fetcher = vi.fn(() => gate.promise);

    const a = withCache('k1', fetcher);
    const b = withCache('k1', fetcher);
    gate.resolve('data');
    const [ra, rb] = await Promise.all([a, b]);

    expect(ra).toBe('data');
    expect(rb).toBe('data');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('shares one flight even when callers pass forceRefresh', async () => {
    const gate = deferred<string>();
    const fetcher = vi.fn(() => gate.promise);

    const a = withCache('k2', fetcher, { forceRefresh: true });
    const b = withCache('k2', fetcher, { forceRefresh: true });
    gate.resolve('fresh-data');
    const [ra, rb] = await Promise.all([a, b]);

    expect(ra).toBe('fresh-data');
    expect(rb).toBe('fresh-data');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('retries after a failure instead of pinning a rejected flight', async () => {
    const gate = deferred<string>();
    const fetcher = vi
      .fn()
      .mockImplementationOnce(() => gate.promise)
      .mockImplementationOnce(async () => 'recovered');

    const a = withCache('k3', fetcher);
    gate.reject(new Error('boom'));
    await expect(a).rejects.toThrow('boom');

    const b = await withCache('k3', fetcher);
    expect(b).toBe('recovered');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('serves the stored result without calling the fetcher', async () => {
    const fetcher = vi.fn(async () => 'cached!');
    await withCache('k4', fetcher);
    const second = await withCache('k4', fetcher);

    expect(second).toBe('cached!');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('forceRefresh bypasses the stored result', async () => {
    const fetcher = vi.fn(async () => 'v1');
    await withCache('k5', fetcher);
    fetcher.mockResolvedValue('v2');

    const result = await withCache('k5', fetcher, { forceRefresh: true });
    expect(result).toBe('v2');
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(getCache().get('k5')?.data).toBe('v2');
  });
});
