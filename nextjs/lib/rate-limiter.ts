/**
 * lib/rate-limiter.ts
 *
 * Rate limiter unificado para todas las API routes.
 *
 * - Si UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN están configurados
 *   usa @upstash/ratelimit con Redis (compatible con multi-instancia/serverless).
 * - De lo contrario cae back a sliding window en memoria (desarrollo local).
 *
 * Para producción instalar: npm i @upstash/ratelimit @upstash/redis
 */

import type { NextApiRequest } from 'next'

// ── In-memory fallback ────────────────────────────────────────────────────────

const _windows = new Map<string, number[]>()

setInterval(() => {
  const now = Date.now()
  for (const [key, hits] of _windows.entries()) {
    const fresh = hits.filter(t => now - t < 60_000)
    if (fresh.length === 0) _windows.delete(key)
    else _windows.set(key, fresh)
  }
}, 5 * 60 * 1_000).unref()

function memoryLimit(key: string, max: number): boolean {
  const now = Date.now()
  const hits = (_windows.get(key) ?? []).filter(t => now - t < 60_000)
  if (hits.length >= max) return true
  _windows.set(key, [...hits, now])
  return false
}

// ── Redis client (lazy, singleton) ────────────────────────────────────────────

let _redis: unknown = null

async function getRedis() {
  if (_redis) return _redis
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require('@upstash/redis')
  _redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  return _redis
}

// ── Public helpers ────────────────────────────────────────────────────────────

export function getClientIp(req: NextApiRequest): string {
  return (
    (req.headers['cf-connecting-ip'] as string) ??
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    req.socket?.remoteAddress ??
    'unknown'
  )
}

/**
 * Returns true if the caller should be rate-limited.
 * @param key  Unique identifier (IP address recommended)
 * @param max  Max requests per minute (default 5)
 */
export async function isRateLimited(key: string, max = 5): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (url && token) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Ratelimit } = require('@upstash/ratelimit')
      const redis = await getRedis()
      const rl = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(max, '1 m'),
        prefix: 'cj_rl',
      })
      const { success } = await rl.limit(key)
      return !success
    } catch (err) {
      console.error('[rate-limiter] Redis error, falling back to memory:', err)
    }
  }

  return memoryLimit(key, max)
}
