type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function rateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

export function getRateLimitHeaders({
  limit,
  remaining,
  resetAt,
}: {
  limit: number;
  remaining: number;
  resetAt: number;
}) {
  return {
    "x-ratelimit-limit": limit.toString(),
    "x-ratelimit-remaining": Math.max(0, remaining).toString(),
    "x-ratelimit-reset": Math.floor(resetAt / 1000).toString(),
  };
}
