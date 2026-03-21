/**
 * pages/galeria/index.tsx
 *
 * Página principal de la galería de Casa Janus.
 * Renderizada con ISR (Incremental Static Regeneration):
 * - getStaticProps genera el HTML estático con las primeras 24 obras
 * - Se regenera cada 10 minutos si hay cambios en Odoo
 * - El cliente carga obras adicionales vía IntersectionObserver
 *
 * URL patterns:
 * /galeria                          → todas las obras
 * /galeria?tecnica=oleo             → filtrado por técnica
 * /galeria?tecnica=oleo&col=sombras → filtrado por colección
 * /galeria?obra=vigilia-en-calma    → modal abierto (shallow)
 */

import { useState, useCallback, useEffect } from 'react'
import type { GetStaticProps, NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'

import GalleryMural from '@/components/gallery/GalleryMural'
import ArtworkModal from '@/components/modal/ArtworkModal'
import { useArtworkModal } from '@/hooks/useArtworkModal'
import { getTechniques, getArtworks } from '@/lib/odoo-client'
import type { Technique, Collection, CollectionSummary, ListResponse, Artwork } from '@/lib/types'
import styles from './Galeria.module.css'

interface GaleriaPageProps {
  techniques: Technique[]
  initialArtworks: ListResponse<Artwork>
}

const GaleriaPage: NextPage<GaleriaPageProps> = ({
  techniques,
  initialArtworks,
}) => {
  const router = useRouter()

  // Leer filtros desde la query
  const activeTechSlug = (router.query.tecnica as string) || ''
  const activeColSlug = (router.query.col as string) || ''

  // Técnica activa
  const activeTechnique = techniques.find(t => t.slug === activeTechSlug) ?? null
  const collections: CollectionSummary[] = activeTechnique?.collections ?? []

  // Estado de artworks para la página actual (se actualiza al cambiar filtros)
  const [currentArtworks, setCurrentArtworks] = useState(initialArtworks)
  const [isFiltering, setIsFiltering] = useState(false)

  // ── Modal ────────────────────────────────────────────────────────────────
  const {
    isOpen, isLoading, artwork, error,
    openModal, closeModal, navigateModal, currentIndex,
  } = useArtworkModal(currentArtworks.data)

  // ── Cambio de filtros: recarga obras del servidor ────────────────────────
  useEffect(() => {
    if (!router.isReady) return

    const fetchFiltered = async () => {
      setIsFiltering(true)
      try {
        const params = new URLSearchParams({ page: '1', per_page: '24' })
        if (activeTechSlug) params.set('technique', activeTechSlug)
        if (activeColSlug) params.set('collection', activeColSlug)

        const res = await fetch(`/api/gallery?${params}`)
        if (!res.ok) throw new Error('Error al filtrar obras')
        const data = await res.json()
        setCurrentArtworks(data.artworks)
      } catch (e) {
        console.error('[galeria] filter fetch error', e)
      } finally {
        setIsFiltering(false)
      }
    }

    // Solo hace fetch si hay filtros distintos a los iniciales
    if (activeTechSlug || activeColSlug) {
      fetchFiltered()
    } else {
      // ✅ Sincroniza correctamente con las obras iniciales
      setCurrentArtworks(initialArtworks)
    }
  }, [activeTechSlug, activeColSlug, router.isReady, initialArtworks])

  // ── Navegar a técnica ────────────────────────────────────────────────────
  const selectTechnique = useCallback((slug: string) => {
    const query: Record<string, string> = {}
    if (slug) query.tecnica = slug
    router.push({ pathname: '/galeria', query }, undefined, { shallow: true, scroll: false })
  }, [router])

  // ── Navegar a colección ──────────────────────────────────────────────────
  const selectCollection = useCallback((slug: string) => {
    const query: Record<string, string> = {}
    if (activeTechSlug) query.tecnica = activeTechSlug
    if (slug) query.col = slug
    router.push({ pathname: '/galeria', query }, undefined, { shallow: true, scroll: false })
  }, [router, activeTechSlug])

  // ── SEO ──────────────────────────────────────────────────────────────────
  const pageTitle = activeTechnique
    ? `${activeTechnique.name} — Galería | Casa Janus`
    : 'Galería | Casa Janus'
  const pageDesc = activeTechnique
    ? `Obras de ${activeTechnique.name} de Casa Janus. ${activeTechnique.description || ''}`
    : 'Galería de arte de Casa Janus. Explora obras por técnica y colección.'

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="website" />
      </Head>

      <div className={styles.page}>
        {/* ── Hero strip ──────────────────────────────────────── */}
        <header className={styles.hero}>
          <p className={styles.heroLabel}>
            {activeTechnique ? activeTechnique.name.toUpperCase() : 'COLECCIÓN'}
          </p>
          <h1 className={styles.heroTitle}>
            {activeTechnique
              ? activeTechnique.name
              : 'Casa Janus'}
          </h1>
        </header>

        {/* ── Tabs de técnica ────────────────────────────────── */}
        <nav className={styles.techniqueTabs} aria-label="Técnicas">
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
              <span className={styles.tabCount}>{t.artwork_count}</span>
            </button>
          ))}
        </nav>

        {/* ── Filtro de colección ─────────────────────────────── */}
        {collections.length > 0 && (
          <div className={styles.collectionBar} role="group" aria-label="Colecciones">
            <span className={styles.collectionBarLabel}>Colección:</span>
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
              </button>
            ))}
          </div>
        )}

        {/* ── Mural ───────────────────────────────────────────── */}
        <main>
          {isFiltering ? (
            <div className={styles.filteringOverlay}>
              <span className={styles.filteringDot} />
              <span className={styles.filteringDot} style={{ animationDelay: '0.15s' }} />
              <span className={styles.filteringDot} style={{ animationDelay: '0.30s' }} />
            </div>
          ) : (
            <GalleryMural
              key={`${activeTechSlug}-${activeColSlug}`}
              initialData={currentArtworks}
              techniqueSlug={activeTechSlug}
              collectionSlug={activeColSlug}
              onArtworkClick={openModal}
            />
          )}
        </main>
      </div>

      {/* ── Modal (fuera del layout) ─────────────────────────── */}
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
    </>
  )
}

export default GaleriaPage

// ── ISR: genera el HTML estático, revalida cada 10 minutos ───────────────────
export const getStaticProps: GetStaticProps<GaleriaPageProps> = async () => {
  const [techniques, initialArtworks] = await Promise.all([
    getTechniques(true),   // con colecciones anidadas para los filtros
    getArtworks({ page: 1, perPage: 24, order: 'year_desc' }),
  ])

  return {
    props: {
      techniques,
      initialArtworks,
    },
    revalidate: 600,   // ISR: 10 minutos
  }
}