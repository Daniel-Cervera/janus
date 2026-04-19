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
import { isRateLimited, getClientIp } from '@/lib/rate-limiter'

// ── Schemas ───────────────────────────────────────────────────────────────────

const BuyerSchema = z.object({
    name: z.string().min(2, 'El nombre es requerido.'),
    email: z.string().email('Email inválido.'),
    phone: z.string().optional(),
})

const CartItemSchema = z.object({
    product_id: z.number().int().positive().nullable(),
    print_id: z.number().int().positive(),
    artwork_id: z.number().int().positive(),
    artwork_slug: z.string(),
    artwork_name: z.string(),
    size_label: z.string(),
    paper_label: z.string(),
    quantity: z.number().int().min(1).max(99),
    price: z.number().positive(),
    currency: z.string(),
})

const CheckoutSchema = z.object({
    buyer: BuyerSchema,
    items: z.array(CartItemSchema).min(1, 'El carrito está vacío.').max(50),
    notes: z.string().max(500).optional(),
})

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido.' })
    }

    const ip = getClientIp(req)

    if (await isRateLimited(ip, 5)) {
        return res.status(429).json({ error: 'Demasiadas solicitudes.' })
    }

    const parsed = CheckoutSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(422).json({
            error: parsed.error.issues?.[0]?.message ?? 'Datos inválidos.',
        })
    }

    const { buyer, items, notes } = parsed.data
    const odooBase = process.env.ODOO_BASE_URL?.replace(/\/$/, '') ?? ''
    const token = process.env.CASA_JANUS_API_TOKEN ?? ''

    // Mapear items del carrito al formato que espera Odoo
    const orderItems = items.map(item => ({
        product_id: item.product_id,
        artwork_slug: item.artwork_slug,
        artwork_name: item.artwork_name,
        size_label: item.size_label,
        paper_label: item.paper_label,
        quantity: item.quantity,
        unit_price: item.price,
        currency: item.currency,
    }))

    try {
        const odooRes = await fetch(`${odooBase}/api/v1/order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ buyer, items: orderItems, notes }),
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