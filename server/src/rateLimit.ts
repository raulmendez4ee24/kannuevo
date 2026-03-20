import type { Request, Response, NextFunction } from 'express';
import { getClientIp } from './audit.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function rateLimit(opts: { windowMs: number; max: number; name: string }) {
  const store = new Map<string, RateLimitEntry>();

  // Cleanup expired entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }, 60_000);

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIp(req);
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || entry.resetAt <= now) {
      store.set(ip, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }

    entry.count++;
    if (entry.count > opts.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'TOO_MANY_REQUESTS', retryAfter });
    }

    next();
  };
}
