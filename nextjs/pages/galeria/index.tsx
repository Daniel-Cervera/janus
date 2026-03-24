/**
 * pages/galeria/index.tsx (v2)
 *
 * Mejoras sobre la versión anterior:
 * - Botón flotante de selección múltiple con contador
 * - Filtros de vista (grid / list) — pendiente implementar list view
 * - Filtros de disponibilidad
 * - Mejor UI en la barra de navegación
 * - Título del Hero dinámico (Colección > Técnica)
 * - Etiqueta superior del Hero estática ("CATÁLOGO" en rojo)
 */

import { useState, useCallback, useEffect } from 'react'
import type { GetStaticProps, NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'

import GalleryMural from '@/components/gallery/GalleryMural'
import ArtworkModal from '@/components/modal/ArtworkModal'
import SelectionDrawer from '@/components/selection/SelectionDrawer'
import { useArtworkModal } from '@/hooks/useArtworkModal'
import { useSelectionStore } from '@/store/selectionStore'
import { getTechniques, getArtworks } from '@/lib/odoo-client'
import type {
  Technique, CollectionSummary, ListResponse, Artwork,
} from '@/lib/types'
import styles from './Galeria.module.css'

interface GaleriaPageProps {
  techniques: Technique[]
  initialArtworks: ListResponse<Artwork>
}

type AvailFilter = '' | 'available' | 'nfs'

const GaleriaPage: NextPage<GaleriaPageProps> = ({ techniques, initialArtworks }) => {
  const router = useRouter()

  const activeTechSlug = (router.query.tecnica as string) || ''
  const activeColSlug = (router.query.col as string) || ''
  const [availFilter, setAvailFilter] = useState<AvailFilter>('')

  const activeTechnique = techniques.find(t => t.slug === activeTechSlug) ?? null
  const collections: CollectionSummary[] = activeTechnique?.collections ?? []

  // Encontramos la colección activa para cambiar el título
  const activeCollection = collections.find(c => c.slug === activeColSlug) ?? null

  const [currentArtworks, setCurrentArtworks] = useState(initialArtworks)
  const [isFiltering, setIsFiltering] = useState(false)

  // Modal
  const { isOpen, isLoading, artwork, error, openModal, closeModal, navigateModal, currentIndex }
    = useArtworkModal(currentArtworks.data)

  // Selección
  const selectionCount = useSelectionStore(s => s.totalItems())
  const openSelection = useSelectionStore(s => s.openDrawer)

  // Fetch filtrado
  useEffect(() => {
    if (!router.isReady) return

    const fetchFiltered = async () => {
      setIsFiltering(true)
      try {
        const params = new URLSearchParams({ page: '1', per_page: '24' })
        if (activeTechSlug) params.set('technique', activeTechSlug)
        if (activeColSlug) params.set('collection', activeColSlug)
        if (availFilter) params.set('availability', availFilter)

        const res = await fetch(`/api/gallery?${params}`)
        if (!res.ok) throw new Error('Error al filtrar')
        const data = await res.json()
        setCurrentArtworks(data.artworks)
      } catch (e) {
        console.error('[galeria] filter error', e)
      } finally {
        setIsFiltering(false)
      }
    }

    if (activeTechSlug || activeColSlug || availFilter) {
      fetchFiltered()
    } else {
      setCurrentArtworks(initialArtworks)
    }
  }, [activeTechSlug, activeColSlug, availFilter, router.isReady, initialArtworks])

  const selectTechnique = useCallback((slug: string) => {
    const query: Record<string, string> = {}
    if (slug) query.tecnica = slug
    router.push({ pathname: '/galeria', query }, undefined, { shallow: true, scroll: false })
  }, [router])

  const selectCollection = useCallback((slug: string) => {
    const query: Record<string, string> = {}
    if (activeTechSlug) query.tecnica = activeTechSlug
    if (slug) query.col = slug
    router.push({ pathname: '/galeria', query }, undefined, { shallow: true, scroll: false })
  }, [router, activeTechSlug])

  const pageTitle = activeTechnique
    ? `${activeTechnique.name} — Galería | Janus`
    : 'Galería | Janus'

  // Determinamos el título del Hero: Prioridad Colección > Técnica > Galería
  const heroTitle = activeCollection
    ? activeCollection.name
    : activeTechnique
      ? activeTechnique.name
      : 'Galería'

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content="Galería de arte de Janus. Explora obras por técnica y colección."
        />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:type" content="website" />
      </Head>

      <div className={styles.page}>

        {/* ── Hero strip ────────────────────────────────── */}
        <header className={styles.hero}>
          <p className={styles.heroLabel} style={{ color: '#E53E3E', fontWeight: 'bold' }}>
            CATÁLOGO
          </p>
          <h1 className={styles.heroTitle}>
            {heroTitle}
          </h1>

          {activeTechnique?.description && (
            <p className={styles.heroDesc}>{activeTechnique.description}</p>
          )}
        </header>

        {/* ── Técnicas ─────────────────────────────────── */}
        <nav className={styles.techniqueTabs} aria-label="Filtrar por técnica">
          <button
            className={`${styles.tab} ${!activeTechSlug ? styles.tabActive : ''}`}
            onClick={() => selectTechnique('')}
          >
            Todas
          </button>
          {techniques.map(t => (
            <button
              key={t.id}
              className={`${styles.tab} ${activeTechSlug === t.slug ? styles.tabActive : ''}`}
              onClick={() => selectTechnique(t.slug)}
            >
              {t.name}
              {t.artwork_count > 0 && (
                <span className={styles.tabCount}>{t.artwork_count}</span>
              )}
            </button>
          ))}
        </nav>

        {/* ── Barra secundaria: colecciones + filtros ───── */}
        <div className={styles.secondaryBar}>
          {/* Pills de colección */}
          {collections.length > 0 && (
            <div
              className={styles.collectionBar}
              role="group"
              aria-label="Filtrar por colección"
            >
              <span className={styles.barLabel}>Colección:</span>
              <button
                className={`${styles.pill} ${!activeColSlug ? styles.pillActive : ''}`}
                onClick={() => selectCollection('')}
              >
                Todas
              </button>
              {collections.map((col: CollectionSummary) => (
                <button
                  key={col.id}
                  className={`${styles.pill} ${activeColSlug === col.slug ? styles.pillActive : ''}`}
                  onClick={() => selectCollection(col.slug)}
                >
                  {col.name}
                  {col.artwork_count > 0 && (
                    <span className={styles.pillCount}>{col.artwork_count}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Filtro de disponibilidad */}
          <div className={styles.availBar} role="group" aria-label="Filtrar por disponibilidad">
            {(['', 'available', 'nfs'] as AvailFilter[]).map(v => {
              const labels: Record<string, string> = {
                '': 'Todas', available: 'Disponibles', nfs: 'No en venta',
              }
              return (
                <button
                  key={v}
                  className={`${styles.filterBtn} ${availFilter === v ? styles.filterBtnActive : ''}`}
                  onClick={() => setAvailFilter(v)}
                >
                  {labels[v]}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Contador de resultados ─────────────────────── */}
        <div className={styles.resultsBar}>
          <span className={styles.resultsCount}>
            {isFiltering ? '…' : currentArtworks.total} obras
          </span>
          {(activeTechSlug || activeColSlug || availFilter) && (
            <button
              className={styles.clearFilters}
              onClick={() => {
                setAvailFilter('')
                router.push('/galeria', undefined, { shallow: true, scroll: false })
              }}
            >
              Limpiar filtros ×
            </button>
          )}
        </div>

        {/* ── Mural ─────────────────────────────────────── */}
        <main>
          {isFiltering ? (
            <div className={styles.filteringState}>
              <span className={styles.dot} />
              <span className={styles.dot} style={{ animationDelay: '0.15s' }} />
              <span className={styles.dot} style={{ animationDelay: '0.30s' }} />
            </div>
          ) : (
            <GalleryMural
              key={`${activeTechSlug}-${activeColSlug}-${availFilter}`}
              initialData={currentArtworks}
              techniqueSlug={activeTechSlug}
              collectionSlug={activeColSlug}
              onArtworkClick={openModal}
            />
          )}
        </main>
      </div>

      {/* ── FAB de selección ──────────────────────────── */}
      {selectionCount > 0 && (
        <button
          className={styles.selectionFab}
          onClick={openSelection}
          aria-label={`Ver selección (${selectionCount} obras)`}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M9 15.5S2 11 2 6.5C2 4.3 3.8 2.5 6 2.5c1.3 0 2.5.7 3 1.8.5-1.1 1.7-1.8 3-1.8C14.2 2.5 16 4.3 16 6.5c0 4.5-7 9-7 9Z"
              fill="currentColor"
            />
          </svg>
          <span className={styles.fabCount}>{selectionCount}</span>
          <span className={styles.fabLabel}>Mi selección</span>
        </button>
      )}

      {/* ── Modal ─────────────────────────────────────── */}
      <ArtworkModal
        isOpen={isOpen}
        isLoading={isLoading}
        artwork={artwork}
        error={error}
        currentIndex={currentIndex}
        totalArtworks={currentArtworks.data.length}
        onClose={closeModal}
        onNavigate={navigateModal}
      />

      {/* ── Selection drawer ──────────────────────────── */}
      <SelectionDrawer />
    </>
  )
}

export default GaleriaPage

export const getStaticProps: GetStaticProps<GaleriaPageProps> = async () => {
  try {
    const [techniques, initialArtworks] = await Promise.all([
      getTechniques(true),
      getArtworks({ page: 1, perPage: 24, order: 'year_desc' }),
    ])
    return { props: { techniques, initialArtworks }, revalidate: 600 }
  } catch {
    return {
      props: {
        techniques: [],
        initialArtworks: { data: [], total: 0, page: 1, per_page: 24, pages: 0 },
      },
      revalidate: 60,
    }
  }
}