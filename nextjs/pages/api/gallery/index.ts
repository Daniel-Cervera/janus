import type { NextApiRequest, NextApiResponse } from 'next'
import { getArtworks } from '@/lib/odoo-client'
import { getMockArtworksList } from '@/lib/mocks'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { technique, collection, page, per_page, order, availability } = req.query

    // Extracción segura (evita arrays de strings de Next.js)
    // Safe extraction (avoids Next.js string arrays)
    const safePage = Array.isArray(page) ? page[0] : (page || '1')
    const safePerPage = Array.isArray(per_page) ? per_page[0] : (per_page || '24')
    const safeOrder = Array.isArray(order) ? order[0] : (order || 'year_desc')
    const safeTechnique = Array.isArray(technique) ? technique[0] : technique
    const safeCollection = Array.isArray(collection) ? collection[0] : collection
    const safeAvailability = Array.isArray(availability) ? availability[0] : availability

    // Mock mode: devolver datos de prueba cuando Odoo no está disponible
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
      const mockResult = getMockArtworksList({
        techniqueSlug: safeTechnique,
        collectionSlug: safeCollection,
        availability: safeAvailability,
        page: parseInt(safePage, 10) || 1,
        perPage: parseInt(safePerPage, 10) || 24,
      })
      return res.status(200).json({ artworks: mockResult })
    }

    // Solo pedimos las obras. ¡Las técnicas ya se cargaron en el HTML inicial!
    // We only fetch artworks. Techniques are already loaded in the initial HTML!
    const artworksResult = await getArtworks({
      techniqueSlug: safeTechnique,
      collectionSlug: safeCollection,
      page: parseInt(safePage, 10) || 1,
      perPage: parseInt(safePerPage, 10) || 24,
      order: safeOrder as 'year_desc' | 'year_asc' | 'name_asc' | 'sequence',
    })

    // Cloudflare CDN cache: 5 min, stale-while-revalidate 1h
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=3600',
    )

    // Solo devolvemos artworks, aligerando el payload
    return res.status(200).json({
      artworks: artworksResult,
    })
  } catch (err) {
    console.error('[api/gallery]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}