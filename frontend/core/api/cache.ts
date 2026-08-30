// Modular cache layer — shared by all feature APIs
// Keeps the 5-minute in-memory cache but now isolated in core (not duplicated per feature)

const cache = new Map<string, { data: any; timestamp: number }>();
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const withCache = async (
  key: string,
  fetcher: () => Promise<any>,
  options?: { forceRefresh?: boolean }
) => {
  const cached = cache.get(key);
  if (!options?.forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

export const clearCache = () => cache.clear();
export const deleteCache = (key: string) => cache.delete(key);
export const getCache = () => cache;
export default { withCache, clearCache, deleteCache, getCache, CACHE_DURATION };
