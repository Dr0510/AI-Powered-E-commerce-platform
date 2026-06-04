// Rate limiting middleware for API endpoints
// Tracks requests by IP + endpoint combination with configurable limits

const isDev = process.env.NODE_ENV === "development";

// In-memory store for tracking requests
// Structure: { "ip:endpoint": [timestamp1, timestamp2, ...] }
const requestStore = new Map();

// Configuration for different endpoints
const DEFAULT_RATE_LIMIT = {
  limit: 100, // requests
  windowMs: 60 * 1000, // 1 minute
};

const ENDPOINT_LIMITS = {
  "POST:/api/products": { limit: 10, windowMs: 60 * 1000 }, // 10/min for admin product creation
  "POST:/api/orders": { limit: 20, windowMs: 60 * 1000 }, // 20/min for order creation
  "POST:/api/auth/register": { limit: 5, windowMs: 60 * 1000 }, // 5/min for registration
  "POST:/api/auth/login": { limit: 10, windowMs: 60 * 1000 }, // 10/min for login
  "POST:/api/payments/razorpay": { limit: 50, windowMs: 60 * 1000 }, // 50/min for payment creation
  // GET requests default to 100/min via DEFAULT_RATE_LIMIT
};

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

/**
 * Extract client IP from request
 * Supports X-Forwarded-For header for proxied requests
 */
function getClientIp(request) {
  const forwarded = request.headers?.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers?.get("x-real-ip") || request.ip || "unknown";
}

/**
 * Determine if request should bypass rate limiting
 */
function shouldBypassRateLimit(ip) {
  // Development bypass
  if (isDev) {
    return ip === "127.0.0.1" || ip === "localhost" || ip === "::1";
  }
  return false;
}

/**
 * Clean up expired entries from request store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  const maxAge = Math.max(...Object.values(ENDPOINT_LIMITS).map((l) => l.windowMs)) || DEFAULT_RATE_LIMIT.windowMs;

  for (const [key, timestamps] of requestStore.entries()) {
    // Keep only recent requests within the longest window
    const filtered = timestamps.filter((ts) => now - ts < maxAge);
    if (filtered.length === 0) {
      requestStore.delete(key);
    } else if (filtered.length < timestamps.length) {
      requestStore.set(key, filtered);
    }
  }

  lastCleanup = now;
}

/**
 * Check if request is rate limited
 */
function isRateLimited(ip, endpoint) {
  const now = Date.now();
  const key = `${ip}:${endpoint}`;
  const config = ENDPOINT_LIMITS[endpoint] || DEFAULT_RATE_LIMIT;
  const { limit, windowMs } = config;

  // Cleanup if needed
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cleanupExpiredEntries();
  }

  // Get or create timestamp array for this key
  const timestamps = requestStore.get(key) || [];

  // Remove timestamps outside the window
  const recentTimestamps = timestamps.filter((ts) => now - ts < windowMs);

  if (recentTimestamps.length >= limit) {
    return {
      limited: true,
      remaining: 0,
      resetIn: Math.ceil((recentTimestamps[0] + windowMs - now) / 1000),
    };
  }

  // Add current request timestamp
  recentTimestamps.push(now);
  requestStore.set(key, recentTimestamps);

  return {
    limited: false,
    remaining: limit - recentTimestamps.length,
    resetIn: Math.ceil(windowMs / 1000),
  };
}

/**
 * Log rate limit violation
 */
function logRateLimitViolation(ip, endpoint, config) {
  if (isDev) {
    console.log(
      `[RATE LIMIT] ${ip} exceeded limit for ${endpoint} (${config.limit}/${Math.floor(config.windowMs / 1000)}s)`
    );
  } else {
    // In production, you might want to send this to monitoring/logging service
    console.warn(`[RATE LIMIT] ${ip} ${endpoint}`);
  }
}

/**
 * Rate limit response generator
 */
function rateLimitResponse(resetIn) {
  return Response.json(
    {
      message: "Too many requests. Please try again later.",
      retryAfter: resetIn,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(resetIn),
        "X-RateLimit-Reset": new Date(Date.now() + resetIn * 1000).toISOString(),
      },
    }
  );
}

/**
 * Extract endpoint path from request
 */
function getEndpointPath(request) {
  try {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const pathname = url.pathname;
    // Remove query parameters and normalize
    return `${method}:${pathname}`;
  } catch {
    return "UNKNOWN";
  }
}

/**
 * Middleware wrapper for rate limiting
 * Usage:
 *   export const POST = withRateLimit(async (request) => { ... })
 *   export const POST = withRateLimit(async (request) => { ... }, { limit: 50, windowMs: 60000 })
 */
export function withRateLimit(handler, options = {}) {
  return async function rateLimitedHandler(request, ...args) {
    try {
      // Get client IP
      const ip = getClientIp(request);

      // Check if should bypass rate limiting
      if (shouldBypassRateLimit(ip)) {
        return await handler(request, ...args);
      }

      // Get endpoint identifier
      const endpoint = getEndpointPath(request);

      // Apply custom options if provided, otherwise use default from ENDPOINT_LIMITS
      let config = ENDPOINT_LIMITS[endpoint];
      if (options && Object.keys(options).length > 0) {
        config = {
          limit: options.limit ?? (config?.limit || DEFAULT_RATE_LIMIT.limit),
          windowMs: options.windowMs ?? (config?.windowMs || DEFAULT_RATE_LIMIT.windowMs),
        };
      } else if (!config) {
        config = DEFAULT_RATE_LIMIT;
      }

      // Check rate limit
      const rateLimitStatus = isRateLimited(ip, endpoint);

      if (rateLimitStatus.limited) {
        logRateLimitViolation(ip, endpoint, config);
        return rateLimitResponse(rateLimitStatus.resetIn);
      }

      // Add rate limit info to response headers if handler supports it
      const response = await handler(request, ...args);

      // Add rate limit headers to response
      if (response && response.status !== 429) {
        const headers = new Headers(response.headers);
        headers.set("X-RateLimit-Limit", String(config.limit));
        headers.set("X-RateLimit-Remaining", String(rateLimitStatus.remaining));
        headers.set("X-RateLimit-Reset", String(Math.ceil((Date.now() + config.windowMs) / 1000)));

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }

      return response;
    } catch (error) {
      // Log error but don't rate limit on error
      console.error("[RATE_LIMIT_ERROR]", error);
      return await handler(request, ...args);
    }
  };
}

/**
 * Get current rate limit stats (for monitoring/debugging)
 */
export function getRateLimitStats() {
  const stats = {};
  for (const [key, timestamps] of requestStore.entries()) {
    stats[key] = {
      count: timestamps.length,
      oldestRequest: timestamps.length > 0 ? new Date(timestamps[0]).toISOString() : null,
      newestRequest: timestamps.length > 0 ? new Date(timestamps[timestamps.length - 1]).toISOString() : null,
    };
  }
  return stats;
}

/**
 * Reset rate limit for specific IP and endpoint (useful for testing/admin)
 */
export function resetRateLimit(ip, endpoint) {
  const key = `${ip}:${endpoint}`;
  requestStore.delete(key);
}

/**
 * Clear all rate limit data (useful for testing/admin)
 */
export function clearAllRateLimits() {
  requestStore.clear();
  lastCleanup = Date.now();
}

/**
 * Get endpoint configuration
 */
export function getEndpointConfig(endpoint) {
  return ENDPOINT_LIMITS[endpoint] || DEFAULT_RATE_LIMIT;
}
