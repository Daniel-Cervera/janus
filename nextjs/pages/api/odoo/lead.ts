/**
 * pages/api/odoo/lead.ts
 *
 * TAREA 4 — Endpoint seguro que crea un Lead en Odoo CRM.
 *
 * Arquitectura BFF (Backend For Frontend):
 *   Navegador → POST /api/odoo/lead → Odoo XML-RPC
 *
 * Las credenciales de Odoo NUNCA llegan al navegador.
 * Solo este servidor conoce ODOO_URL, ODOO_DB, ODOO_PASSWORD.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import xmlrpc from 'xmlrpc'

// ── Validación ────────────────────────────────────────────────────────────────

const LeadSchema = z.object({
  website: z.string().max(0).optional().default(''),
  name: z
    .string().min(2).max(120).trim()
    .transform(s => s.replace(/[<>&"']/g, '')),
  email: z
    .string().email('Email inválido.').max(254).trim().toLowerCase(),
  phone: z
    .string().max(30).trim().optional().or(z.literal('')),
  message: z
    .string().min(10, 'Mensaje muy corto.').max(2000).trim()
    .transform(s => s.replace(/[<>]/g, '')),
})

type LeadInput = z.infer<typeof LeadSchema>

// ── Rate limiter ──────────────────────────────────────────────────────────────

const ipHits = new Map<string, number[]>()
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const hits = (ipHits.get(ip) ?? []).filter(t => now - t < 60_000)
  if (hits.length >= 3) return true
  ipHits.set(ip, [...hits, now])
  return false
}

// ── Odoo XML-RPC ──────────────────────────────────────────────────────────────

function xmlrpcCall<T>(client: xmlrpc.Client, method: string, params: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    client.methodCall(method, params, (err, value) => {
      if (err) reject(err)
      else resolve(value as T)
    })
  })
}

async function createOdooLead(data: LeadInput): Promise<number> {
  const odooUrl = process.env.ODOO_URL ?? 'http://localhost:8069'
  const db = process.env.ODOO_DB ?? 'casajanus'
  const user = process.env.ODOO_USERNAME ?? 'admin'
  const pass = process.env.ODOO_PASSWORD ?? 'admin'

  const isSSL = odooUrl.startsWith('https')
  const mk = isSSL ? xmlrpc.createSecureClient : xmlrpc.createClient

  const common = mk({ url: `${odooUrl}/xmlrpc/2/common` })
  const object = mk({ url: `${odooUrl}/xmlrpc/2/object` })

  // 1. Autenticar
  const uid = await xmlrpcCall<number>(common, 'authenticate', [db, user, pass, {}])
  if (!uid || uid <= 0) throw new Error('Auth fallida con Odoo')

  // 2. Crear lead en crm.lead
  const leadData: Record<string, unknown> = {
    name: `Web: ${data.name}`,
    contact_name: data.name,
    email_from: data.email,
    description: data.message,
    type: 'lead',
  }
  if (data.phone) leadData.phone = data.phone

  return xmlrpcCall<number>(object, 'execute_kw', [
    db, uid, pass, 'crm.lead', 'create', [leadData],
  ])
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' })

  const ip = (req.headers['cf-connecting-ip'] as string)
    ?? (req.headers['x-forwarded-for'] as string)?.split(',')[0]
    ?? 'unknown'

  if (isRateLimited(ip)) return res.status(429).json({ error: 'Demasiadas solicitudes.' })

  const parsed = LeadSchema.safeParse(req.body)
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    parsed.error.issues.forEach(e => { errors[e.path[0]?.toString() ?? 'general'] = e.message })
    return res.status(422).json({ errors })
  }

  if (parsed.data.website) return res.status(200).json({ success: true })

  try {
    const leadId = await createOdooLead(parsed.data)
    return res.status(201).json({ success: true, lead_id: leadId })
  } catch (err) {
    console.error('[api/odoo/lead]', err)
    return res.status(503).json({ error: 'Error al enviar. Por favor intenta de nuevo.' })
  }
}
