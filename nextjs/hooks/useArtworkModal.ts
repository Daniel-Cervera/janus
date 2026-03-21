/**
 * hooks/useArtworkModal.ts
 *
 * Gestiona el estado del modal de obra:
 *  - Abre/cierra sin cambiar de página (shallow routing)
 *  - Actualiza la URL con ?obra=<slug> para que sea compartible
 *  - Carga el detalle de obra vía /api/artwork/[slug]
 *  - Soporte de teclado: Escape cierra, ← → navegan entre obras del mural
 *  - Bloquea scroll del body cuando el modal está abierto
 *  - Precarga la siguiente obra en background
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import type { ArtworkDetail, Artwork } from '@/lib/types'

interface UseArtworkModalReturn {
  isOpen: boolean
  isLoading: boolean
  artwork: ArtworkDetail | null
  error: string | null
  openModal: (slug: string, index?: number) => void
  closeModal: () => void
  navigateModal: (direction: 1 | -1) => void
  currentIndex: number
}

export function useArtworkModal(
  artworks: Artwork[],
): UseArtworkModalReturn {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [artwork, setArtwork] = useState<ArtworkDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(-1)

  // Ref para el abort controller — cancela fetch si el modal se cierra rápido
  const abortRef = useRef<AbortController | null>(null)
  // Ref para guardar URL previa (para restaurar al cerrar)
  const prevUrlRef = useRef<string>('')

  // ── Fetch del detalle de obra ─────────────────────────────────────────────
  const fetchArtwork = useCallback(async (slug: string) => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/artwork/${slug}`, {
        signal: abortRef.current.signal,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setArtwork(data.data)
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return
      setError('No pudimos cargar los detalles de esta obra.')
      console.error('[useArtworkModal]', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Precarga de obra adyacente ────────────────────────────────────────────
  const prefetchAdjacent = useCallback((idx: number) => {
    const next = artworks[idx + 1]
    const prev = artworks[idx - 1]
      ;[next, prev].filter(Boolean).forEach(a => {
        // Prefetch silencioso vía link rel=prefetch
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = `/api/artwork/${a.slug}`
        document.head.appendChild(link)
      })
  }, [artworks])

  // ── Abrir modal ───────────────────────────────────────────────────────────
  const openModal = useCallback((slug: string, index?: number) => {
    prevUrlRef.current = router.asPath

    const idx = index ?? artworks.findIndex(a => a.slug === slug)
    setCurrentIndex(idx)
    setIsOpen(true)

    // Shallow routing: actualiza URL sin recargar página
    router.push(
      { pathname: router.pathname, query: { ...router.query, obra: slug } },
      undefined,
      { shallow: true, scroll: false },
    )

    fetchArtwork(slug)
    if (idx >= 0) prefetchAdjacent(idx)

    // Bloquear scroll del body
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${getScrollbarWidth()}px`
  }, [router, artworks, fetchArtwork, prefetchAdjacent])

  // ── Cerrar modal ──────────────────────────────────────────────────────────
  const closeModal = useCallback(() => {
    setIsOpen(false)
    setArtwork(null)
    setCurrentIndex(-1)
    abortRef.current?.abort()

    // Restaurar URL sin el parámetro ?obra=
    const { obra: _obra, ...restQuery } = router.query
    router.push(
      { pathname: router.pathname, query: restQuery },
      undefined,
      { shallow: true, scroll: false },
    )

    // Restaurar scroll
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  }, [router])

  // ── Navegar entre obras ───────────────────────────────────────────────────
  const navigateModal = useCallback((direction: 1 | -1) => {
    if (artworks.length === 0) return
    const nextIdx = (currentIndex + direction + artworks.length) % artworks.length
    const nextArtwork = artworks[nextIdx]
    if (!nextArtwork) return

    setCurrentIndex(nextIdx)
    setArtwork(null)

    router.replace(
      { pathname: router.pathname, query: { ...router.query, obra: nextArtwork.slug } },
      undefined,
      { shallow: true, scroll: false },
    )

    fetchArtwork(nextArtwork.slug)
    prefetchAdjacent(nextIdx)
  }, [artworks, currentIndex, router, fetchArtwork, prefetchAdjacent])

  // ── Abrir desde URL directa ───────────────────────────────────────────────
  // Si la página carga con ?obra= en la URL (link compartido)
  useEffect(() => {
    const slug = router.query.obra as string | undefined
    if (slug && !isOpen) {
      const idx = artworks.findIndex(a => a.slug === slug)
      setCurrentIndex(idx)
      setIsOpen(true)
      fetchArtwork(slug)
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${getScrollbarWidth()}px`
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady])

  // ── Teclado ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
      if (e.key === 'ArrowRight') navigateModal(1)
      if (e.key === 'ArrowLeft') navigateModal(-1)
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, closeModal, navigateModal])

  // ── Botón atrás del navegador cierra el modal ─────────────────────────────
  useEffect(() => {
    const handleRouteChange = () => {
      if (isOpen && !router.query.obra) {
        setIsOpen(false)
        setArtwork(null)
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
      }
    }
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => router.events.off('routeChangeComplete', handleRouteChange)
  }, [isOpen, router])

  return {
    isOpen, isLoading, artwork, error,
    openModal, closeModal, navigateModal, currentIndex,
  }
}

function getScrollbarWidth(): number {
  if (typeof window === 'undefined') return 0
  return window.innerWidth - document.documentElement.clientWidth
}