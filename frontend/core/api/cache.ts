// Modular cache layer — shared by all feature APIs
// Keeps the 5-minute in-memory cache but now isolated in core (not duplicated per feature)

const cache = new Map<string, { data: any; timestamp: number }>();
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// In-flight flights by key — concurrent callers (spam refresh, simultaneous
// mounts) share one network request instead of stampeding the backend.
const inflight = new Map<string, Promise<any>>();

export const withCache = async (
  key: string,
  fetcher: () => Promise<any>,
  options?: { forceRefresh?: boolean }
) => {
  const cached = cache.get(key);
  if (!options?.forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  const pending = inflight.get(key);
  if (pending) {
    return pending;
  }
  const promise = (async () => {
    try {
      const data = await fetcher();
      cache.set(key, { data, timestamp: Date.now() });
      return data;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, promise);
  return promise;
};

export const clearCache = () => cache.clear();
export const deleteCache = (key: string) => cache.delete(key);
export const getCache = () => cache;
export default { withCache, clearCache, deleteCache, getCache, CACHE_DURATION };
