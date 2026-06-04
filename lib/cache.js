const DEFAULT_TTL = 5 * 60 * 1000;
const MAX_SIZE_BYTES = 100 * 1024 * 1024;
const CLEANUP_INTERVAL = 60 * 1000;

const cacheStore = new Map();
let cacheSize = 0;
let cleanupInterval = null;

function calculateSize(value) {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function initializeCleanup() {
  if (cleanupInterval) {
    return;
  }

  cleanupInterval = setInterval(() => {
    const now = Date.now();

    for (const [key, entry] of cacheStore.entries()) {
      if (now > entry.expiresAt) {
        cacheSize -= entry.size;
        cacheStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);

  cleanupInterval.unref?.();
}

function evictLRU(requiredBytes) {
  const entries = Array.from(cacheStore.entries()).sort(
    (a, b) => a[1].lastAccessed - b[1].lastAccessed,
  );

  for (const [key, entry] of entries) {
    if (requiredBytes <= 0) {
      break;
    }

    cacheSize -= entry.size;
    cacheStore.delete(key);
    requiredBytes -= entry.size;
  }
}

function getCacheEntry(key) {
  const entry = cacheStore.get(key);
  if (!entry) {
    return null;
  }

  const now = Date.now();
  if (now > entry.expiresAt) {
    cacheSize -= entry.size;
    cacheStore.delete(key);
    return null;
  }

  entry.lastAccessed = now;
  return entry;
}

function setCacheEntry(key, value, ttl = DEFAULT_TTL) {
  const size = calculateSize(value);
  if (size > MAX_SIZE_BYTES * 0.1) {
    return false;
  }

  const oldEntry = cacheStore.get(key);
  if (oldEntry) {
    cacheSize -= oldEntry.size;
  }

  if (cacheSize + size > MAX_SIZE_BYTES) {
    evictLRU(cacheSize + size - MAX_SIZE_BYTES);
  }

  const now = Date.now();
  cacheStore.set(key, {
    value,
    size,
    createdAt: now,
    expiresAt: now + ttl,
    lastAccessed: now,
  });
  cacheSize += size;

  return true;
}

function clearCache() {
  cacheStore.clear();
  cacheSize = 0;
}

function invalidateByPattern(pattern) {
  let cleared = 0;

  for (const [key, entry] of cacheStore.entries()) {
    if (pattern.test ? pattern.test(key) : key.includes(pattern)) {
      cacheSize -= entry.size;
      cacheStore.delete(key);
      cleared += 1;
    }
  }

  return cleared;
}

function isJsonResponse(response) {
  return response.headers.get("content-type")?.includes("application/json");
}

export function cacheMiddleware(handler, options = {}) {
  const {
    keyGenerator = (request) => `products:${new URL(request.url).search || "?default"}`,
    ttl = DEFAULT_TTL,
  } = options;

  initializeCleanup();

  return async (request, ...args) => {
    if (request.method !== "GET") {
      return handler(request, ...args);
    }

    const cacheKey = keyGenerator(request);
    const cached = getCacheEntry(cacheKey);

    if (cached) {
      const response = new Response(cached.value.body, {
        status: cached.value.status,
        headers: cached.value.headers,
      });
      response.headers.set("X-Cache", "HIT");
      response.headers.set("X-Cache-Age", String(Math.round((Date.now() - cached.createdAt) / 1000)));
      return response;
    }

    const response = await handler(request, ...args);

    if (response.status === 200 && isJsonResponse(response)) {
      const body = await response.clone().text();
      setCacheEntry(
        cacheKey,
        {
          body,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
        },
        ttl,
      );
    }

    response.headers.set("X-Cache", "MISS");
    return response;
  };
}

export function invalidateProductCache() {
  return invalidateByPattern(/^products:/);
}

export const cacheUtils = {
  clearCache,
  getCacheEntry,
  setCacheEntry,
  invalidateByPattern,
  getCacheStats() {
    return {
      entries: cacheStore.size,
      sizeBytes: cacheSize,
      sizeMB: (cacheSize / 1024 / 1024).toFixed(2),
      maxSizeMB: (MAX_SIZE_BYTES / 1024 / 1024).toFixed(0),
    };
  },
};
