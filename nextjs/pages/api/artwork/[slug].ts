/**
 * pages/api/artwork/[slug].ts
 *
 * Detalle de una obra por slug.
 * El modal del mural llama a este endpoint con fetch en el cliente
 * para cargar el detalle SIN cambiar de página (shallow routing).
 *
 * GET /api/artwork/vigilia-en-calma-2022
 *
 * La URL del navegador se actualiza con:
 *   router.push(`/galeria?obra=${slug}`, undefined, { shallow: true })
 * para que la obra sea compartible y el botón "atrás" cierre el modal.
 *
 * Cache: 10 min en Cloudflare (obras pueden actualizarse con más frecuencia)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getArtwork } from '@/lib/odoo-client'
import { getMockArtworkDetail } from '@/lib/mocks'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { slug } = req.query

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Missing slug' })
  }

  try {
    // Mock mode
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
      const mockArtwork = getMockArtworkDetail(slug)
      if (!mockArtwork) return res.status(404).json({ error: 'Artwork not found' })
      return res.status(200).json({ data: mockArtwork })
    }

    const artwork = await getArtwork(slug)

    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' })
    }

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=600, stale-while-revalidate=3600',
    )

    return res.status(200).json({ data: artwork })
  } catch (err) {
    console.error(`[api/artwork/${slug}]`, err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}