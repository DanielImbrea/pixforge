/**
 * In-memory sliding-window rate limiter. Suitable for MVP / single-instance
 * deployments. On Vercel, each serverless instance has its own memory, so
 * this provides best-effort protection, not a hard global guarantee. At
 * scale (Section 11 of the architecture spec), replace the `hits` Map below
 * with Upstash Redis (`@upstash/ratelimit`) using the same `checkRateLimit`
 * function signature so call sites never change.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const hits = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = hits.get(key) || { timestamps: [] };

  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    hits.set(key, entry);
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.timestamps[0] + windowMs,
    };
  }

  entry.timestamps.push(now);
  hits.set(key, entry);

  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    resetAt: now + windowMs,
  };
}

// Periodic cleanup to avoid unbounded memory growth across many distinct keys.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

export function maybeCleanupRateLimitStore(maxAgeMs = 10 * 60 * 1000): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of hits.entries()) {
    const freshTimestamps = entry.timestamps.filter((t) => now - t < maxAgeMs);
    if (freshTimestamps.length === 0) {
      hits.delete(key);
    } else {
      entry.timestamps = freshTimestamps;
    }
  }
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'unknown';
}
