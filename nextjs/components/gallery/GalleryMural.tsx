/**
 * components/gallery/GalleryMural.tsx
 */

import { memo } from 'react'
import styles from './GalleryMural.module.css'
import ArtworkCard from './ArtworkCard'
import { useMural } from '@/hooks/useMural'
import type { Artwork, ListResponse } from '@/lib/types'

interface GalleryMuralProps {
  initialData: ListResponse<Artwork>
  techniqueSlug?: string
  collectionSlug?: string
  onArtworkClick: (slug: string, index: number) => void
}

const SKELETON_HEIGHTS = [180, 240, 200, 160]

function GalleryMural({
  initialData,
  techniqueSlug,
  collectionSlug,
  onArtworkClick,
}: GalleryMuralProps) {
  const { artworks, total, hasMore, isLoadingMore, sentinelRef } = useMural({
    initialData,
    techniqueSlug,
    collectionSlug,
    perPage: 12,
  })

  if (artworks.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Sin obras en esta selección</p>
        <p className={styles.emptySubtitle}>Prueba con otra técnica o colección</p>
      </div>
    )
  }

  return (
    <section className={styles.section} aria-label="Galería de obras">
      <div className={styles.countBar}>
        <span className={styles.count}>
          {artworks.length}
          {hasMore && <span className={styles.countOf}> de {total}</span>}
          {' '}obras
        </span>
      </div>

      <div className={styles.mural}>
        {artworks.map((artwork, index) => (
          <ArtworkCard
            key={artwork.id}
            artwork={artwork}
            index={index}
            onOpen={onArtworkClick}
          />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true">
          {isLoadingMore && (
            <div className={styles.loadingRow}>
              {SKELETON_HEIGHTS.map((height, i) => (
                <div
                  key={i}
                  className={styles.skeleton}
                  style={{
                    height: `${height}px`,
                    animationDelay: `${i * 120}ms`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {!hasMore && artworks.length > 0 && (
        <div className={styles.endMarker} aria-hidden="true">
          <div className={styles.endLine} />
          <span className={styles.endText}>fin de la colección</span>
          <div className={styles.endLine} />
        </div>
      )}
    </section>
  )
}

export default memo(GalleryMural)
