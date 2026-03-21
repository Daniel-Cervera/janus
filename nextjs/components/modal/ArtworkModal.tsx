/**
 * components/modal/ArtworkModal.tsx
 *
 * Modal de detalle de obra. Características:
 *  - No cambia de página — usa shallow routing (?obra=<slug>)
 *  - Imagen principal con zoom on-hover
 *  - Galería de imágenes adicionales (thumbnails)
 *  - Información completa: técnica, dimensiones, edición, año
 *  - Precio y disponibilidad
 *  - CTA: Adquirir obra original | Ver prints/reproducciones
 *  - Navegación ← → entre obras del mural
 *  - Cierre con Escape, clic en backdrop, botón ✕
 *  - Focus trap para accesibilidad
 *  - Animación de entrada/salida
 */

import { useEffect, useRef, useState } from 'react'
import styles from './ArtworkModal.module.css'
import { cfImageUrl } from '@/lib/odoo-client'
import type { ArtworkDetail, PrintProduct } from '@/lib/types'

interface ArtworkModalProps {
  isOpen: boolean
  isLoading: boolean
  artwork: ArtworkDetail | null
  error: string | null
  currentIndex: number
  totalArtworks: number
  onClose: () => void
  onNavigate: (direction: 1 | -1) => void
}

const AVAILABILITY_LABELS: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: '#22c55e' },
  reserved: { label: 'Reservada', color: '#f59e0b' },
  sold: { label: 'Vendida', color: '#ef4444' },
  nfs: { label: 'No en venta', color: '#6b7280' },
}

export default function ArtworkModal({
  isOpen, isLoading, artwork, error,
  currentIndex, totalArtworks,
  onClose, onNavigate,
}: ArtworkModalProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [showPrints, setShowPrints] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Resetear imagen activa cuando cambia la obra
  useEffect(() => {
    setActiveImageIdx(0)
    setShowPrints(false)
  }, [artwork?.id])

  // Focus trap: enfocar el botón de cerrar al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeButtonRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Clic en backdrop cierra
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose()
  }

  if (!isOpen) return null

  const avail = artwork
    ? (AVAILABILITY_LABELS[artwork.availability] ?? AVAILABILITY_LABELS.nfs)
    : null

  const allImages = artwork
    ? [
      ...(artwork.primary_image?.cf_id ? [{
        cf_id: artwork.primary_image.cf_id,
        alt_text: artwork.name,
      }] : []),
      ...(artwork.images ?? []).filter(
        img => img.cf_id !== artwork.primary_image?.cf_id
      ),
    ]
    : []

  const activeImage = allImages[activeImageIdx]
  const canBuy = artwork?.availability === 'available'
  const hasPrints = (artwork?.prints?.length ?? 0) > 0

  return (
    <div
      ref={backdropRef}
      className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={artwork ? `Detalle: ${artwork.name}` : 'Cargando obra'}
    >
      <div className={styles.modal}>
        {/* ── Botón cerrar ─────────────────────────────────────── */}
        <button
          ref={closeButtonRef}
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Cerrar"
        >
          <CloseIcon />
        </button>

        {/* ── Navegación entre obras ────────────────────────── */}
        <div className={styles.navBtns}>
          <button
            className={styles.navBtn}
            onClick={() => onNavigate(-1)}
            aria-label="Obra anterior"
            disabled={totalArtworks <= 1}
          >
            <ArrowLeftIcon />
          </button>
          <span className={styles.navCount}>
            {currentIndex + 1} / {totalArtworks}
          </span>
          <button
            className={styles.navBtn}
            onClick={() => onNavigate(1)}
            aria-label="Obra siguiente"
            disabled={totalArtworks <= 1}
          >
            <ArrowRightIcon />
          </button>
        </div>

        {/* ── Panel izquierdo: imagen ───────────────────────── */}
        <div className={styles.imagePanel}>
          {isLoading && (
            <div className={styles.imageSkeleton} />
          )}

          {!isLoading && activeImage && (
            <div className={styles.imageContainer}>
              <img
                key={activeImage.cf_id}
                src={cfImageUrl(activeImage.cf_id, 'large')}
                alt={activeImage.alt_text || artwork?.name || ''}
                className={styles.mainImage}
                loading="eager"
                decoding="async"
              />
            </div>
          )}

          {/* Thumbnails de imágenes adicionales */}
          {!isLoading && allImages.length > 1 && (
            <div className={styles.thumbRow}>
              {allImages.map((img, i) => (
                <button
                  key={img.cf_id}
                  className={`${styles.thumb} ${i === activeImageIdx ? styles.thumbActive : ''}`}
                  onClick={() => setActiveImageIdx(i)}
                  aria-label={`Imagen ${i + 1}`}
                  aria-pressed={i === activeImageIdx}
                >
                  <img
                    src={cfImageUrl(img.cf_id, 'thumb')}
                    alt=""
                    className={styles.thumbImg}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Panel derecho: info + acciones ───────────────── */}
        <div className={styles.infoPanel}>
          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : artwork ? (
            <>
              {/* Técnica */}
              <p className={styles.techniqueTag}>
                {artwork.technique.name}
                {artwork.medium && (
                  <span className={styles.mediumTag}> · {artwork.medium}</span>
                )}
              </p>

              {/* Título */}
              <h2 className={styles.title}>{artwork.name}</h2>

              {/* Metadatos */}
              <div className={styles.metaRow}>
                <span className={styles.year}>{artwork.year}</span>
                {artwork.dimensions.label && (
                  <>
                    <span className={styles.metaSep}>·</span>
                    <span className={styles.dims}>{artwork.dimensions.label}</span>
                  </>
                )}
                {artwork.edition && (
                  <>
                    <span className={styles.metaSep}>·</span>
                    <span className={styles.edition}>Ed. {artwork.edition}</span>
                  </>
                )}
              </div>

              {/* Colección */}
              <p className={styles.collection}>
                Colección: <strong>{artwork.collection.name}</strong>
              </p>

              <div className={styles.divider} />

              {/* Descripción */}
              {artwork.description && (
                <p className={styles.description}>{artwork.description}</p>
              )}

              <div className={styles.spacer} />

              {/* Precio y disponibilidad */}
              {artwork.availability !== 'nfs' && (
                <div className={styles.priceRow}>
                  <div>
                    <p className={styles.priceLabel}>precio</p>
                    <p className={styles.price}>
                      {artwork.currency === 'MXN' ? '$' : 'USD '}
                      {artwork.price.toLocaleString('es-MX', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                      {artwork.currency === 'MXN' && (
                        <span className={styles.priceCurrency}> MXN</span>
                      )}
                    </p>
                  </div>
                  {avail && (
                    <div className={styles.availBadge}>
                      <span
                        className={styles.availDot}
                        style={{ background: avail.color }}
                      />
                      <span className={styles.availLabel}>{avail.label}</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── CTAs ─────────────────────────────────────── */}
              <div className={styles.ctas}>
                {canBuy && (
                  <button className={styles.btnPrimary} onClick={() => {
                    // Integrar con Odoo e-commerce / carrito
                    if (artwork.product_tmpl_id) {
                      window.location.href = `/shop/product/${artwork.product_tmpl_id}`
                    } else {
                      window.location.href = `/encargos?ref=${artwork.slug}`
                    }
                  }}>
                    Adquirir obra
                  </button>
                )}

                {hasPrints && (
                  <button
                    className={`${styles.btnSecondary} ${showPrints ? styles.btnActive : ''}`}
                    onClick={() => setShowPrints(p => !p)}
                  >
                    {showPrints ? 'Ocultar prints' : `Prints disponibles (${artwork.prints.length})`}
                  </button>
                )}

                <button
                  className={styles.btnGhost}
                  onClick={() => window.location.href = `/encargos?ref=${artwork.slug}`}
                >
                  Consultar al artista
                </button>
              </div>

              {/* ── Panel de prints ───────────────────────── */}
              {showPrints && hasPrints && (
                <div className={styles.printsPanel}>
                  <p className={styles.printsTitle}>Reproducciones disponibles</p>
                  {artwork.prints.map(print => (
                    <PrintRow key={print.id} print={print} />
                  ))}
                </div>
              )}

              {/* Share link */}
              <button
                className={styles.shareBtn}
                onClick={() => {
                  const url = `${window.location.origin}/galeria?obra=${artwork.slug}`
                  navigator.clipboard?.writeText(url)
                    .then(() => alert('Enlace copiado'))
                    .catch(() => { })
                }}
              >
                <ShareIcon />
                Copiar enlace de la obra
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function PrintRow({ print }: { print: PrintProduct }) {
  return (
    <div className={styles.printRow}>
      <div>
        <p className={styles.printSize}>{print.size_label}</p>
        <p className={styles.printPaper}>{print.paper_label}</p>
      </div>
      <div className={styles.printRight}>
        <p className={styles.printPrice}>
          {print.currency} {print.price.toLocaleString('es-MX', {
            minimumFractionDigits: 0
          })}
        </p>
        <button
          className={styles.btnPrintBuy}
          disabled={!print.in_stock}
        >
          {print.in_stock ? 'Añadir' : 'Agotado'}
        </button>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className={styles.loadingSkeleton}>
      <div className={styles.skLine} style={{ width: '35%', height: 10 }} />
      <div className={styles.skLine} style={{ width: '70%', height: 28, marginTop: 10 }} />
      <div className={styles.skLine} style={{ width: '50%', height: 10, marginTop: 8 }} />
      <div className={styles.skDivider} />
      <div className={styles.skLine} style={{ width: '100%', height: 10, marginTop: 16 }} />
      <div className={styles.skLine} style={{ width: '90%', height: 10, marginTop: 6 }} />
      <div className={styles.skLine} style={{ width: '80%', height: 10, marginTop: 6 }} />
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className={styles.errorState}>
      <p className={styles.errorText}>{message}</p>
    </div>
  )
}

// ── SVG Icons inline ──────────────────────────────────────────────────────────
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M10 1L12 3L10 5M12 3H5.5C3.567 3 2 4.567 2 6.5V12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

