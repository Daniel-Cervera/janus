/**
 * components/gallery/ArtworkCard.tsx (v2)
 *
 * Tarjeta del mural con:
 *  - Botón de corazón para selección múltiple
 *  - Preview de descripción al hover
 *  - Badge de disponibilidad visual
 *  - Estado seleccionado con borde rojo
 */

import { useCallback, useState } from 'react'
import styles from './ArtworkCard.module.css'
import { cfImageUrl, artworkSrcSet } from '@/lib/odoo-client'
import { useSelectionStore } from '@/store/selectionStore'
import type { Artwork } from '@/lib/types'

interface ArtworkCardProps {
  artwork: Artwork
  index: number
  onOpen: (slug: string, index: number) => void
}

const AVAILABILITY_CONFIG: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: '#22c55e' },
  reserved: { label: 'Reservada', color: '#f59e0b' },
  sold: { label: 'Vendida', color: '#ef4444' },
  nfs: { label: 'No en venta', color: '#6b7280' },
}

const SKELETON_HEIGHTS = [180, 240, 200, 160]

export default function ArtworkCard({ artwork, index, onOpen }: ArtworkCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const isSelected = useSelectionStore(s => s.isSelected(artwork.id))
  const toggleItem = useSelectionStore(s => s.toggleItem)

  const avail = AVAILABILITY_CONFIG[artwork.availability] ?? AVAILABILITY_CONFIG.nfs
  const cfId = artwork.primary_image?.cf_id
  const { aspect_ratio } = artwork.dimensions

  const handleClick = useCallback(() => onOpen(artwork.slug, index), [artwork.slug, index, onOpen])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(artwork.slug, index) }
  }, [artwork.slug, index, onOpen])

  const handleHeartClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    toggleItem(artwork)
  }, [artwork, toggleItem])

  return (
    <article
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
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
        {/* Skeleton */}
        {!imgLoaded && !imgError && (
          <div className={styles.skeleton} aria-hidden="true">
            <div className={styles.skeletonShimmer} />
          </div>
        )}

        {/* Imagen */}
        {!imgError && cfId && (
          <img
            src={cfImageUrl(cfId, 'medium')}
            srcSet={artworkSrcSet(cfId)}
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
            alt={artwork.name}
            className={`${styles.image} ${imgLoaded ? styles.imageLoaded : styles.imageHidden}`}
            loading={index < 6 ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={index < 6 ? 'high' : 'low'}
            width={400}
            height={Math.round(400 * aspect_ratio)}
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgError(true); setImgLoaded(true) }}
          />
        )}

        {imgError && (
          <div className={styles.errorPlaceholder} aria-hidden="true">
            <span className={styles.errorIcon}>◻</span>
          </div>
        )}

        {/* Overlay oscuro */}
        <div className={styles.overlay} aria-hidden="true" />

        {/* Info hover */}
        <div className={styles.info}>
          <div className={styles.infoInner}>
            <p className={styles.title}>{artwork.name}</p>
            <div className={styles.meta}>
              <span className={styles.year}>{artwork.year}</span>
              {artwork.medium && (
                <span className={styles.medium}>{artwork.medium}</span>
              )}
            </div>
            {/* Descripción breve */}
            {artwork.description && (
              <p className={styles.desc}>
                {artwork.description.length > 80
                  ? artwork.description.slice(0, 80) + '…'
                  : artwork.description}
              </p>
            )}
            <div className={styles.infoBottom}>
              {(artwork.price ?? 0) > 0 && artwork.availability !== 'nfs' && (
                <span className={styles.price}>
                  {artwork.currency} {(artwork.price ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                </span>
              )}
              <span
                className={styles.availBadge}
                style={{ background: `${avail.color}20`, color: avail.color }}
              >
                {avail.label}
              </span>
            </div>
          </div>
        </div>

        {/* Botón corazón — selección múltiple */}
        <button
          className={`${styles.heartBtn} ${isSelected ? styles.heartBtnActive : ''}`}
          onClick={handleHeartClick}
          aria-label={isSelected ? `Quitar ${artwork.name} de selección` : `Seleccionar ${artwork.name}`}
          aria-pressed={isSelected}
          title={isSelected ? 'Quitar de selección' : 'Añadir a selección'}
        >
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            aria-hidden="true"
          >
            <path
              d="M8 13.5S1.5 9.5 1.5 5.5C1.5 3.5 3 2 5 2c1.2 0 2.2.6 3 1.5C8.8 2.6 9.8 2 11 2c2 0 3.5 1.5 3.5 3.5 0 4-6.5 8-6.5 8Z"
              stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"
              fill={isSelected ? 'currentColor' : 'none'}
            />
          </svg>
        </button>

        {/* Badge destacada */}
        {artwork.is_featured && (
          <div className={styles.featuredBadge} aria-label="Obra destacada">
            <span className={styles.featuredText}>destacada</span>
          </div>
        )}

        {/* Borde de selección */}
        {isSelected && (
          <div className={styles.selectedBorder} aria-hidden="true" />
        )}
      </div>
    </article>
  )
}
