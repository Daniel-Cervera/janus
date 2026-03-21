/**
 * pages/api/commission/index.ts
 *
 * API Route blindada para encargos personalizados.
 *
 * Capas de seguridad (de exterior hacia interior):
 *  1. Rate limiting por IP con sliding window (en memoria para dev,
 *     compatible con Upstash Redis en producción)
 *  2. Validación y saneamiento con Zod (tipado + sanitización)
 *  3. Honeypot anti-bot (campo oculto)
 *  4. Verificación Cloudflare Turnstile (CAPTCHA invisible)
 *  5. Proxy hacia Odoo sin exponer URL ni token al cliente
 *  6. Manejo de errores HTTP 4xx/5xx de Odoo con mensajes seguros
 *
 * Variables de entorno requeridas:
 *   CASA_JANUS_API_TOKEN    — Bearer token de Odoo
 *   ODOO_BASE_URL           — URL interna de Odoo
 *   TURNSTILE_SECRET_KEY    — Clave secreta de Cloudflare Turnstile
 *                             (opcional — si no está, se omite la verificación)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

// ── Rate Limiter (sliding window, en memoria) ─────────────────────────────────
// Para producción: reemplazar por @upstash/ratelimit con Redis
// El patrón de interfaz es idéntico — solo cambiar la implementación.

const WINDOW_MS = 60_000  // 1 minuto
const MAX_REQ = 3       // 3 intentos por ventana

const ipWindows = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const hits = (ipWindows.get(ip) ?? []).filter(t => now - t < WINDOW_MS)
  if (hits.length >= MAX_REQ) return true
  ipWindows.set(ip, [...hits, now])
  return false
}

// ── Schema Zod ────────────────────────────────────────────────────────────────
// Validación + sanitización + coerción de tipos en un solo paso.
// Zod lanza ZodError con paths exactos si algo falla — nunca llega a Odoo.

const CommissionSchema = z.object({
  // Honeypot: debe estar vacío. Bots lo rellenan automáticamente.
  website: z.string().max(0, 'Bot detected').optional().default(''),

  // Token Cloudflare Turnstile (opcional si la variable de entorno no está)
  cf_turnstile_token: z.string().optional(),

  // Datos del cliente
  partner_name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(120, 'El nombre es demasiado largo.')
    .trim()
    // Eliminar caracteres de control y HTML para prevenir XSS/injection
    .transform(s => s.replace(/[<>&"']/g, '').replace(/[\x00-\x1F]/g, '')),

  email: z
    .string()
    .email('El email no tiene un formato válido.')
    .max(254, 'El email es demasiado largo.')
    .trim()
    .toLowerCase(),

  phone: z
    .string()
    .max(30, 'El teléfono es demasiado largo.')
    .trim()
    .optional()
    .or(z.literal('')),

  description: z
    .string()
    .min(30, 'Por favor añade más detalles (mínimo 30 caracteres).')
    .max(2000, 'La descripción es demasiado larga.')
    .trim()
    .transform(s => s.replace(/[<>]/g, '')),

  budget_range: z
    .enum(['lt500', '500_1500', '1500_5k', '5k_15k', 'gt15k'])
    .optional(),

  technique_id: z
    .number()
    .int()
    .positive()
    .optional()
    .or(z.string().regex(/^\d+$/).transform(Number).optional()),

  ref_artwork_id: z
    .number()
    .int()
    .positive()
    .optional()
    .or(z.string().regex(/^\d+$/).transform(Number).optional()),
})

type CommissionInput = z.infer<typeof CommissionSchema>

// ── Cloudflare Turnstile verification ─────────────────────────────────────────

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true  // omitir si no está configurado

  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    }
  )
  const data = await res.json()
  return data.success === true
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getClientIp(req: NextApiRequest): string {
  return (
    (req.headers['cf-connecting-ip'] as string)      // IP real via Cloudflare
    ?? (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    ?? req.socket?.remoteAddress
    ?? 'unknown'
  )
}

function odooUrl(path: string): string {
  const base = process.env.ODOO_BASE_URL?.replace(/\/$/, '') ?? ''
  return `${base}/api/v1${path}`
}

// ── Handler principal ─────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' })
  }

  const ip = getClientIp(req)

  // ── Capa 1: Rate limiting ─────────────────────────────────────────────────
  if (isRateLimited(ip)) {
    return res.status(429).json({
      error: 'Demasiadas solicitudes. Por favor espera un momento.',
    })
  }

  // ── Capa 2: Validación Zod ────────────────────────────────────────────────
  const parsed = CommissionSchema.safeParse(req.body)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach(e => {
      const field = e.path[0]?.toString() ?? 'general'
      fieldErrors[field] = e.message
    })
    return res.status(422).json({ errors: fieldErrors })
  }

  const data: CommissionInput = parsed.data

  // ── Capa 3: Honeypot ──────────────────────────────────────────────────────
  if (data.website) {
    // Respuesta 200 silenciosa para no revelar que fue detectado
    return res.status(200).json({ success: true, message: 'Solicitud recibida.' })
  }

  // ── Capa 4: Turnstile ─────────────────────────────────────────────────────
  if (process.env.TURNSTILE_SECRET_KEY && data.cf_turnstile_token) {
    const valid = await verifyTurnstile(data.cf_turnstile_token, ip)
    if (!valid) {
      return res.status(403).json({ error: 'Verificación de seguridad fallida.' })
    }
  }

  // ── Capa 5: Proxy hacia Odoo ──────────────────────────────────────────────
  // Solo enviamos campos que Odoo espera — nunca el honeypot ni el token
  const payload = {
    partner_name: data.partner_name,
    email: data.email,
    phone: data.phone || undefined,
    description: data.description,
    budget_range: data.budget_range,
    technique_id: data.technique_id,
    ref_artwork_id: data.ref_artwork_id,
  }

  let odooRes: Response
  try {
    odooRes = await fetch(odooUrl('/commission'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // El token NUNCA sale hacia el cliente
        'Authorization': `Bearer ${process.env.CASA_JANUS_API_TOKEN ?? ''}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000), // timeout de 10 segundos
    })
  } catch (err: unknown) {
    // Timeout o red caída — no revelar detalles internos
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'
    console.error('[commission] Odoo unreachable:', err)
    return res.status(503).json({
      error: isTimeout
        ? 'El servidor tardó demasiado. Por favor intenta de nuevo.'
        : 'No pudimos procesar tu solicitud. Por favor intenta más tarde.',
    })
  }

  // ── Capa 6: Manejo de errores Odoo ────────────────────────────────────────
  if (!odooRes.ok) {
    const body = await odooRes.json().catch(() => ({}))
    console.error(`[commission] Odoo ${odooRes.status}:`, body)

    // Mapear errores de Odoo a mensajes seguros para el usuario
    const safeMessages: Record<number, string> = {
      400: 'Los datos enviados no son válidos.',
      401: 'Error de autenticación con el servidor.',
      403: 'No tienes permiso para realizar esta acción.',
      429: 'Demasiadas solicitudes al servidor. Por favor espera.',
      500: 'Error interno del servidor. Por favor intenta más tarde.',
      503: 'El servicio no está disponible. Por favor intenta más tarde.',
    }

    return res.status(odooRes.status).json({
      error: safeMessages[odooRes.status]
        ?? 'Ocurrió un error inesperado. Por favor intenta más tarde.',
    })
  }

  const result = await odooRes.json()
  return res.status(201).json(result)
}