/**
 * pages/api/commission/index.ts
 *
 * Proxy del formulario de encargos personalizados hacia Odoo.
 * Implementa:
 *  - Validación de campos requeridos
 *  - Honeypot anti-spam (campo oculto "website")
 *  - Rate limiting básico por IP (complementado con Cloudflare Rate Limiting)
 *  - No expone la URL de Odoo al cliente
 *
 * POST /api/commission
 * Body: CommissionPayload (JSON)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { submitCommission } from '@/lib/odoo-client'
import type { CommissionPayload } from '@/lib/types'

// Rate limiting en memoria (para desarrollo).
// En producción, usar Cloudflare Rate Limiting en el Worker o Upstash Redis.
const RATE_LIMIT_WINDOW_MS = 60_000   // 1 min
const RATE_LIMIT_MAX = 3         // 3 envíos por IP por minuto

const ipTimestamps: Map<string, number[]> = new Map()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = (ipTimestamps.get(ip) ?? []).filter(
    t => now - t < RATE_LIMIT_WINDOW_MS
  )
  if (timestamps.length >= RATE_LIMIT_MAX) return true
  ipTimestamps.set(ip, [...timestamps, now])
  return false
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', process.env.NEXTAUTH_URL ?? '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Rate limiting
  const ip = (req.headers['cf-connecting-ip'] as string)
    ?? (req.headers['x-forwarded-for'] as string)?.split(',')[0]
    ?? req.socket.remoteAddress
    ?? 'unknown'

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Demasiadas solicitudes. Por favor espera un momento.' })
  }

  const body = req.body as CommissionPayload & { website?: string }

  // Honeypot: el campo "website" debe estar vacío (bots lo rellenan)
  if (body.website) {
    // Silently reject spam, return 200 to confuse bots
    return res.status(200).json({ success: true, message: 'Solicitud recibida.' })
  }

  // Validación básica
  const errors: Record<string, string> = {}
  if (!body.partner_name?.trim()) errors.partner_name = 'El nombre es requerido.'
  if (!body.email?.trim()) errors.email = 'El email es requerido.'
  if (!body.description?.trim()) errors.description = 'La descripción es requerida.'

  // Validación de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (body.email && !emailRegex.test(body.email)) {
    errors.email = 'El email no tiene un formato válido.'
  }

  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ errors })
  }

  try {
    const result = await submitCommission({
      partner_name: body.partner_name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim(),
      description: body.description.trim(),
      budget_range: body.budget_range,
      technique_id: body.technique_id,
      ref_artwork_id: body.ref_artwork_id,
    })

    return res.status(201).json(result)
  } catch (err) {
    console.error('[api/commission]', err)
    return res.status(500).json({
      error: 'No pudimos procesar tu solicitud. Por favor intenta de nuevo o contáctanos directamente.',
    })
  }
}