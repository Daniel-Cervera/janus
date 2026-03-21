/**
 * hooks/useMural.ts
 *
 * Gestiona la carga incremental del mural masonry:
 *  - Primera carga: 24 obras (desde getStaticProps, sin JS)
 *  - Carga adicional: batches de 12 vía IntersectionObserver
 *  - Filtros reactivos: al cambiar técnica/colección, resetea y recarga
 *  - Estado de carga y error
 *  - Evita requests duplicados con un flag de "fetching"
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Artwork, ListResponse } from '@/lib/types'

interface UseMuralOptions {
  initialData: ListResponse<Artwork>
  techniqueSlug?: string
  collectionSlug?: string
  perPage?: number
}

interface UseMuralReturn {
  artworks: Artwork[]
  total: number
  hasMore: boolean
  isLoadingMore: boolean
  sentinelRef: React.RefObject<HTMLDivElement>
}

export function useMural({
  initialData,
  techniqueSlug,
  collectionSlug,
  perPage = 12,
}: UseMuralOptions): UseMuralReturn {
  const [artworks, setArtworks] = useState<Artwork[]>(initialData.data)
  const [total, setTotal] = useState(initialData.total)
  const [page, setPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const fetchingRef = useRef(false)

  const hasMore = artworks.length < total

  // ── Reset cuando cambian los filtros ──────────────────────────────────────
  useEffect(() => {
    setArtworks(initialData.data)
    setTotal(initialData.total)
    setPage(1)
  }, [initialData, techniqueSlug, collectionSlug])

  // ── Cargar siguiente página ───────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return
    fetchingRef.current = true
    setIsLoadingMore(true)

    const nextPage = page + 1

    try {
      const params = new URLSearchParams({
        page:     String(nextPage),
        per_page: String(perPage),
      })
      if (techniqueSlug)  params.set('technique',  techniqueSlug)
      if (collectionSlug) params.set('collection', collectionSlug)

      const res = await fetch(`/api/gallery?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: { artworks: ListResponse<Artwork> } = await res.json()

      setArtworks(prev => {
        // Deduplicar por id por si la paginación de Odoo devuelve solapados
        const existingIds = new Set(prev.map(a => a.id))
        const fresh = data.artworks.data.filter(a => !existingIds.has(a.id))
        return [...prev, ...fresh]
      })
      setTotal(data.artworks.total)
      setPage(nextPage)
    } catch (err) {
      console.error('[useMural] loadMore error:', err)
    } finally {
      setIsLoadingMore(false)
      fetchingRef.current = false
    }
  }, [hasMore, page, perPage, techniqueSlug, collectionSlug])

  // ── IntersectionObserver en el sentinel ───────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      {
        // Dispara cuando el sentinel está a 300px de entrar al viewport
        // Da tiempo para que las imágenes carguen antes de ser visibles
        rootMargin: '300px',
        threshold: 0,
      },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  return { artworks, total, hasMore, isLoadingMore, sentinelRef }
}
