// Modular cache layer — shared by all feature APIs.
//
// Bounded LRU + in-flight dedupe (2.4). Previously an unbounded Map with
// no dedupe: identical concurrent requests each fired a fetch, and entries
// accumulated forever. Nuclear clearCache() on mutation is KEPT
// deliberately — prefix invalidation risks stale cross-module reads
// (registry edits affect dashboard stats, approval counts, …) and at this
// scale a correct full refresh beats a clever stale one.

type Entry = { data: any; timestamp: number; ttlMs?: number };

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<any>>();

export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes default TTL
export const CACHE_MAX_ENTRIES = 200;

function touch(key: string, entry: Entry): void {
  // Map preserves insertion order: re-insert to mark most-recently-used.
  store.delete(key);
  store.set(key, entry);
}

function evictIfNeeded(): void {
  while (store.size > CACHE_MAX_ENTRIES) {
    const oldest = store.keys().next();
    if (oldest.done) break;
    store.delete(oldest.value);
  }
}

export const withCache = async (
  key: string,
  fetcher: () => Promise<any>,
  options?: { forceRefresh?: boolean; ttlMs?: number },
): Promise<any> => {
  const ttlMs = options?.ttlMs ?? CACHE_DURATION;
  if (!options?.forceRefresh) {
    const cached = store.get(key);
    // ttlMs fallback: entries hand-set via getCache().set predate per-key
    // TTLs and only carry {data, timestamp}.
    if (cached && Date.now() - cached.timestamp < (cached.ttlMs ?? CACHE_DURATION)) {
      touch(key, cached);
      return cached.data;
    }
    const pending = inflight.get(key);
    if (pending) return pending;
  }

  const task = (async () => {
    try {
      const data = await fetcher();
      const entry: Entry = { data, timestamp: Date.now(), ttlMs };
      touch(key, entry);
      evictIfNeeded();
      return data;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, task);
  return task;
};

export const clearCache = () => {
  store.clear();
  // In-flight requests are left to settle; their results land in the fresh
  // (empty) cache instead of resurrecting stale data mid-mutation.
};
export const deleteCache = (key: string) => {
  store.delete(key);
  inflight.delete(key);
};
export const getCache = () => store;
export default { withCache, clearCache, deleteCache, getCache, CACHE_DURATION, CACHE_MAX_ENTRIES };
