/**
 * components/gallery/ArtworkCard.tsx
 *
 * Tarjeta del mural masonry con:
 * - Skeleton loading elegante mientras la imagen resuelve
 * - Shimmer animation durante la carga
 * - fetchpriority correctamente en minúsculas (evita hydration warning)
 * - aspect-ratio reservado con CSS para evitar CLS
 * - Transición suave de skeleton → imagen
 */

import { useCallback, useState } from 'react'
import styles from './ArtworkCard.module.css'
import { cfImageUrl, artworkSrcSet } from '@/lib/odoo-client'
import type { Artwork } from '@/lib/types'

interface ArtworkCardProps {
  artwork: Artwork
  index: number
  onOpen: (slug: string, index: number) => void
}

const IMG_SIZES = '(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw'

const AVAILABILITY_CONFIG: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: '#22c55e' },
  reserved: { label: 'Reservada', color: '#f59e0b' },
  sold: { label: 'Vendida', color: '#ef4444' },
  nfs: { label: 'No en venta', color: '#6b7280' },
}

export default function ArtworkCard({ artwork, index, onOpen }: ArtworkCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const avail = AVAILABILITY_CONFIG[artwork.availability] ?? AVAILABILITY_CONFIG.nfs
  const cfId = artwork.primary_image?.cf_id
  const { aspect_ratio } = artwork.dimensions

  const handleClick = useCallback(() => {
    onOpen(artwork.slug, index)
  }, [artwork.slug, index, onOpen])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen(artwork.slug, index)
    }
  }, [artwork.slug, index, onOpen])

  return (
    <article
      className={styles.card}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Ver ${artwork.name}, ${artwork.year}`}
      style={{ '--anim-delay': `${Math.min(index * 40, 400)}ms` } as React.CSSProperties}
    >
      <div
        className={styles.imageWrap}
        style={{ aspectRatio: `1 / ${aspect_ratio}` }}
      >
        {/* Skeleton — visible mientras carga la imagen */}
        {!imgLoaded && !imgError && (
          <div className={styles.skeleton} aria-hidden="true">
            <div className={styles.skeletonShimmer} />
          </div>
        )}

        {/* Imagen — se vuelve visible tras onLoad */}
        {!imgError && cfId && (
          <img
            src={cfImageUrl(cfId, 'medium')}
            srcSet={artworkSrcSet(cfId)}
            sizes={IMG_SIZES}
            alt={artwork.name}
            className={`${styles.image} ${imgLoaded ? styles.imageLoaded : styles.imageHidden}`}
            loading={index < 6 ? 'eager' : 'lazy'}
            decoding="async"
            // ✅ AHORA SÍ ESTÁ EN MINÚSCULAS ✅
            fetchPriority={index < 6 ? 'high' : 'low'}
            width={400}
            height={Math.round(400 * aspect_ratio)}
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgError(true); setImgLoaded(true) }}
          />
        )}

        {/* Fallback si la imagen falla */}
        {imgError && (
          <div className={styles.errorPlaceholder} aria-hidden="true">
            <span className={styles.errorIcon}>◻</span>
          </div>
        )}

        {/* Overlay y hover info */}
        <div className={styles.overlay} aria-hidden="true" />
        <div className={styles.info}>
          <div className={styles.infoInner}>
            <p className={styles.title}>{artwork.name}</p>
            <div className={styles.meta}>
              <span className={styles.year}>{artwork.year}</span>
              {artwork.availability !== 'nfs' && (
                <span
                  className={styles.availDot}
                  style={{ '--dot-color': avail.color } as React.CSSProperties}
                  aria-label={avail.label}
                />
              )}
            </div>
          </div>
        </div>

        {/* Badge destacada */}
        {artwork.is_featured && (
          <div className={styles.featuredBadge} aria-label="Obra destacada">
            <span className={styles.featuredText}>destacada</span>
          </div>
        )}
      </div>
    </article>
  )
}