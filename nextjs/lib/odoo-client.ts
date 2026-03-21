/**
 * lib/odoo-client.ts
 * Cliente tipado para la API headless de Casa Janus (Odoo).
 */

import type {
  Technique,
  Collection,
  Artwork,
  ArtworkDetail,
  Artist,
  Exhibition,
  CommissionPayload,
  CommissionResponse,
  ListResponse,
} from './types'

// ── Config ────────────────────────────────────────────────────────────────────

const ODOO_BASE = process.env.ODOO_BASE_URL?.replace(/\/$/, '') ?? ''
const API_TOKEN = process.env.ODOO_API_TOKEN ?? ''
const API_PREFIX = `${ODOO_BASE}/api/v1`

// ── Cloudflare Images helpers ─────────────────────────────────────────────────

export type CFVariant = 'thumb' | 'medium' | 'large' | 'public'

const CF_BASE = process.env.NEXT_PUBLIC_CF_IMAGES_BASE?.replace(/\/$/, '') ?? ''

const VARIANT_SIZES: Record<CFVariant, number> = {
  thumb: 400,
  medium: 900,
  large: 1600,
  public: 800,
}

/**
 * Construye una URL de imagen.
 * - IDs que empiezan con "test-" o "demo-" → Picsum (sin Cloudflare)
 * - IDs reales → Cloudflare Images
 */
export function cfImageUrl(
  cfId: string | null | undefined,
  variant: CFVariant = 'public',
): string {
  if (!cfId) return '/images/placeholder-obra.jpg'

  // Modo pruebas — usa Picsum Photos (imágenes gratuitas, sin Cloudflare)
  if (cfId.startsWith('test-') || cfId.startsWith('demo-')) {
    const seed = cfId.replace(/^(test|demo)-/, '') || '1'
    const size = VARIANT_SIZES[variant]
    return `https://picsum.photos/seed/${seed}/${size}/${size}`
  }

  // Producción — Cloudflare Images
  if (!CF_BASE) return '/images/placeholder-obra.jpg'
  return `${CF_BASE}/${cfId}/${variant}`
}

/**
 * Genera el srcset para <img srcSet> en el mural masonry.
 */
export function artworkSrcSet(cfId: string | null | undefined): string {
  if (!cfId) return ''
  return [
    `${cfImageUrl(cfId, 'thumb')} 400w`,
    `${cfImageUrl(cfId, 'medium')} 900w`,
    `${cfImageUrl(cfId, 'large')} 1600w`,
  ].join(', ')
}

// ── HTTP client base ──────────────────────────────────────────────────────────

interface FetchOptions {
  params?: Record<string, string | number | boolean>
  revalidate?: number
  tags?: string[]
}

async function apiFetch<T>(endpoint: string, opts: FetchOptions = {}): Promise<T> {
  // FIX: advertir solo en runtime, no en build time
  if (!ODOO_BASE || !API_TOKEN) {
    throw new OdooAPIError(
      503,
      endpoint,
      'ODOO_BASE_URL or ODOO_API_TOKEN is not set in environment variables.',
    )
  }

  const url = new URL(`${API_PREFIX}${endpoint}`)

  if (opts.params) {
    Object.entries(opts.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
    })
  }

  // 👇 LOGS DE DEBUGGEO (Colocados antes del fetch) 👇
  console.log(`\n[DEBUG ODOO] Endpoint: ${url.toString()}`)
  console.log(`[DEBUG ODOO] Token detectado: "${API_TOKEN}"\n`)

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      Accept: 'application/json',
    },
    next: {
      revalidate: opts.revalidate ?? 3600,
      tags: opts.tags,
    },
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    throw new OdooAPIError(res.status, endpoint, errorBody)
  }

  return res.json() as Promise<T>
}

export class OdooAPIError extends Error {
  constructor(
    public readonly status: number,
    public readonly endpoint: string,
    public readonly body: string,
  ) {
    super(`Odoo API ${status} at ${endpoint}`)
    this.name = 'OdooAPIError'
  }
}

// ── API methods ───────────────────────────────────────────────────────────────

export async function getTechniques(withCollections = false): Promise<Technique[]> {
  const data = await apiFetch<ListResponse<Technique>>('/techniques', {
    params: { with_collections: withCollections },
    revalidate: 3600,
    tags: ['techniques'],
  })
  return data.data
}

export async function getCollections(opts: {
  techniqueSlug?: string
  techniqueId?: number
  withArtworks?: boolean
} = {}): Promise<Collection[]> {
  const data = await apiFetch<ListResponse<Collection>>('/collections', {
    params: {
      ...(opts.techniqueSlug ? { technique_slug: opts.techniqueSlug } : {}),
      ...(opts.techniqueId ? { technique_id: opts.techniqueId } : {}),
      with_artworks: opts.withArtworks ?? false,
    },
    revalidate: 3600,
    tags: ['collections', opts.techniqueSlug ? `technique:${opts.techniqueSlug}` : ''],
  })
  return data.data
}

export async function getArtworks(opts: {
  techniqueSlug?: string
  collectionSlug?: string
  availability?: 'available' | 'sold' | 'reserved' | 'nfs'
  featured?: boolean
  page?: number
  perPage?: number
  order?: 'year_desc' | 'year_asc' | 'name_asc' | 'sequence'
} = {}): Promise<ListResponse<Artwork>> {
  return apiFetch<ListResponse<Artwork>>('/artworks', {
    params: {
      ...(opts.techniqueSlug ? { technique_slug: opts.techniqueSlug } : {}),
      ...(opts.collectionSlug ? { collection_slug: opts.collectionSlug } : {}),
      ...(opts.availability ? { availability: opts.availability } : {}),
      ...(opts.featured !== undefined ? { featured: opts.featured } : {}),
      page: opts.page ?? 1,
      per_page: opts.perPage ?? 24,
      order: opts.order ?? 'year_desc',
    },
    revalidate: 600,
    tags: [
      'artworks',
      opts.techniqueSlug ? `technique:${opts.techniqueSlug}` : '',
      opts.collectionSlug ? `collection:${opts.collectionSlug}` : '',
    ].filter(Boolean),
  })
}

export async function getArtwork(slug: string): Promise<ArtworkDetail | null> {
  try {
    const data = await apiFetch<{ data: ArtworkDetail }>(`/artwork/${slug}`, {
      revalidate: 600,
      tags: [`artwork:${slug}`, 'artworks'],
    })
    return data.data
  } catch (err) {
    if (err instanceof OdooAPIError && err.status === 404) return null
    throw err
  }
}

export async function getArtist(): Promise<Artist | null> {
  try {
    const data = await apiFetch<{ data: Artist }>('/artist', {
      revalidate: 86400,
      tags: ['artist'],
    })
    return data.data
  } catch (err) {
    if (err instanceof OdooAPIError && err.status === 404) return null
    throw err
  }
}

export async function getExhibitions(opts: {
  state?: 'upcoming' | 'active' | 'past' | 'all'
  limit?: number
} = {}): Promise<Exhibition[]> {
  const data = await apiFetch<ListResponse<Exhibition>>('/exhibitions', {
    params: {
      state: opts.state ?? 'all',
      limit: opts.limit ?? 20,
    },
    revalidate: 3600,
    tags: ['exhibitions'],
  })
  return data.data
}

export async function submitCommission(
  payload: CommissionPayload,
): Promise<CommissionResponse> {
  const res = await fetch(`${API_PREFIX}/commission`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new OdooAPIError(res.status, '/commission', JSON.stringify(body))
  }
  return res.json()
}

// ── Static path helpers ───────────────────────────────────────────────────────

export async function getAllArtworkSlugs(): Promise<string[]> {
  const results: string[] = []
  let page = 1
  let fetched = 0
  let total = 0

  try {
    const first = await getArtworks({ page: 1, perPage: 100 })
    total = first.total ?? 0
    first.data.forEach(a => results.push(a.slug))
    fetched = first.data.length
    page = 2

    while (fetched < total) {
      const res = await getArtworks({ page, perPage: 100 })
      if (!res.data?.length) break
      res.data.forEach(a => results.push(a.slug))
      fetched += res.data.length
      page++
    }
  } catch (error) {
    console.error('[odoo-client] getAllArtworkSlugs error:', error)
  }

  return results
}

export async function getAllTechniqueSlugs(): Promise<string[]> {
  try {
    const techniques = await getTechniques()
    return techniques.map(t => t.slug)
  } catch {
    return []
  }
}