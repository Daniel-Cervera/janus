/**
 * components/gallery/ArtworkCard.tsx
 *
 * Tarjeta individual del mural masonry.
 * Diseño: imagen a sangre, hover revela título y año desde abajo.
 * Imagen con lazy loading nativo + srcset dinámico de Cloudflare.
 * El aspect-ratio se reserva con CSS para evitar CLS.
 */

import { useCallback } from 'react'
import styles from './ArtworkCard.module.css'
import { cfImageUrl, artworkSrcSet } from '@/lib/odoo-client'
import type { Artwork } from '@/lib/types'

interface ArtworkCardProps {
  artwork: Artwork
  index: number
  onOpen: (slug: string, index: number) => void
}

// Tamaños responsivos del mural:
// móvil (< 640px): 2 columnas → ~50vw
// tablet (640-1023px): 3 columnas → ~33vw
// desktop (≥ 1024px): 4 columnas → ~25vw
const IMG_SIZES = '(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw'

// Etiqueta de disponibilidad
const AVAILABILITY_CONFIG: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: '#22c55e' },
  reserved: { label: 'Reservada', color: '#f59e0b' },
  sold: { label: 'Vendida', color: '#ef4444' },
  nfs: { label: 'No en venta', color: '#6b7280' },
}

export default function ArtworkCard({ artwork, index, onOpen }: ArtworkCardProps) {
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
      {/* Contenedor de imagen con aspect-ratio reservado */}
      <div
        className={styles.imageWrap}
        style={{ aspectRatio: `1 / ${aspect_ratio}` }}
      >
        <img
          src={cfImageUrl(cfId, 'medium')}
          srcSet={artworkSrcSet(cfId)}
          sizes={IMG_SIZES}
          alt={artwork.name}
          className={styles.image}
          fetchPriority="high"
          loading={index < 6 ? 'eager' : 'lazy'}
          decoding="async"
          width={400}
          height={Math.round(400 * aspect_ratio)}
        />

        {/* Overlay de hover */}
        <div className={styles.overlay} aria-hidden="true" />

        {/* Info que emerge al hover */}
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

