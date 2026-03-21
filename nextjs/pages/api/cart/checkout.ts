/**
 * pages/api/cart/checkout.ts
 *
 * API Route para procesar órdenes de prints desde el carrito.
 * Envía la orden a Odoo e-commerce o crea un encargo de prints.
 *
 * Seguridad:
 *  - Validación Zod del payload del carrito
 *  - Rate limiting por IP
 *  - Proxy hacia Odoo sin exponer credenciales
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

// ── Schema ────────────────────────────────────────────────────────────────────

const CartItemSchema = z.object({
    product_id: z.number().int().positive().nullable(),
    print_id: z.number().int().positive(),
    artwork_id: z.number().int().positive(),
    quantity: z.number().int().min(1).max(99),
    price: z.number().positive(),
})

const CheckoutSchema = z.object({
    items: z.array(CartItemSchema).min(1, 'El carrito está vacío.').max(50),
})

// ── Rate limiter ──────────────────────────────────────────────────────────────

const ipHits = new Map<string, number[]>()
function isRateLimited(ip: string): boolean {
    const now = Date.now()
    const hits = (ipHits.get(ip) ?? []).filter(t => now - t < 60_000)
    if (hits.length >= 5) return true
    ipHits.set(ip, [...hits, now])
    return false
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido.' })
    }

    const ip = (req.headers['cf-connecting-ip'] as string)
        ?? (req.headers['x-forwarded-for'] as string)?.split(',')[0]
        ?? 'unknown'

    if (isRateLimited(ip)) {
        return res.status(429).json({ error: 'Demasiadas solicitudes.' })
    }

    const parsed = CheckoutSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(422).json({
            error: parsed.error.issues?.[0]?.message ?? 'Datos inválidos.',
        })
    }

    const { items } = parsed.data
    const odooBase = process.env.ODOO_BASE_URL?.replace(/\/$/, '') ?? ''
    const token = process.env.CASA_JANUS_API_TOKEN ?? ''

    try {
        // Enviar orden de prints a Odoo
        // El endpoint /api/v1/prints/order debe ser implementado en el módulo Odoo
        const odooRes = await fetch(`${odooBase}/api/v1/prints/order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ items }),
            signal: AbortSignal.timeout(10_000),
        })

        if (!odooRes.ok) {
            const body = await odooRes.json().catch(() => ({}))
            console.error('[cart/checkout] Odoo error:', odooRes.status, body)
            return res.status(502).json({
                error: 'No pudimos procesar tu orden. Por favor intenta de nuevo.',
            })
        }

        const result = await odooRes.json()
        return res.status(201).json(result)
    } catch (err) {
        console.error('[cart/checkout] Error:', err)
        return res.status(503).json({
            error: 'El servidor no está disponible. Por favor intenta más tarde.',
        })
    }
}