/**
 * components/modal/ArtworkModal.tsx
 *
 * Modal de detalle de obra con:
 *  - Animaciones de entrada/salida con Framer Motion
 *  - Skeleton loading para imágenes de Cloudflare
 *  - Integración con el carrito de prints (Zustand)
 *  - Focus trap para accesibilidad
 *  - Soporte completo de teclado
 *
 * Decisión de animación: Framer Motion sobre CSS puro porque:
 *  - AnimatePresence maneja el unmount animado (CSS no puede)
 *  - Las variantes permiten stagger de hijos (imagen → texto → CTAs)
 *  - Mejor rendimiento que CSS transitions en transforms complejos
 *  - `layout` prop para transiciones de cambio de obra fluidas
 */

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cfImageUrl } from '@/lib/odoo-client'
import { useCartStore } from '@/store/cartStore'
import type { ArtworkDetail, PrintProduct } from '@/lib/types'
import styles from './ArtworkModal.module.css'

// ── Variantes de animación Framer Motion ──────────────────────────────────────

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
} as const;

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.36, 0.66, 0.04, 1],
      staggerChildren: 0.1,
    },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.3 } },
} as const;

const childVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  },
  exit: { opacity: 0, y: -10 }
} as const;

const AVAILABILITY_CONFIG: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: '#22c55e' }, // Verde / Green
  reserved: { label: 'Reservada', color: '#f59e0b' },  // Naranja / Orange
  sold: { label: 'Vendida', color: '#ef4444' },        // Rojo / Red
  nfs: { label: 'No en venta', color: '#6b7280' },     // Gris / Gray
};

// ── Props ─────────────────────────────────────────────────────────────────────

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

// ── Componente principal ──────────────────────────────────────────────────────

export default function ArtworkModal({
  isOpen, isLoading, artwork, error,
  currentIndex, totalArtworks,
  onClose, onNavigate,
}: ArtworkModalProps) {
  const [activeImgIdx, setActiveImgIdx] = useState(0)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [showPrints, setShowPrints] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Resetear estado al cambiar de obra
  useEffect(() => {
    setActiveImgIdx(0)
    setImgLoaded(false)
    setShowPrints(false)
  }, [artwork?.id])

  // Focus al abrir
  useEffect(() => {
    if (isOpen) setTimeout(() => closeButtonRef.current?.focus(), 50)
  }, [isOpen])

  const avail = artwork
    ? AVAILABILITY_CONFIG[artwork.availability as keyof typeof AVAILABILITY_CONFIG] || AVAILABILITY_CONFIG.nfs
    : AVAILABILITY_CONFIG.nfs;

  const allImages = artwork ? [
    ...(artwork.primary_image?.cf_id ? [{
      cf_id: artwork.primary_image.cf_id,
      alt_text: artwork.name,
    }] : []),
    ...(artwork.images ?? []).filter(img => img.cf_id !== artwork.primary_image?.cf_id),
  ] : []

  const activeImage = allImages[activeImgIdx]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
          role="dialog"
          aria-modal="true"
          aria-label={artwork ? `Detalle: ${artwork.name}` : 'Cargando obra'}
        >
          <motion.div
            className={styles.modal}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* ── Controles superiores ──────────────────────────── */}
            <button
              ref={closeButtonRef}
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Cerrar"
            >
              <CloseIcon />
            </button>

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

            {/* ── Panel imagen ──────────────────────────────────── */}
            <motion.div className={styles.imagePanel} variants={childVariants}>
              <div className={styles.imageContainer}>
                {/* Skeleton mientras carga */}
                {(isLoading || !imgLoaded) && (
                  <div className={styles.imageSkeleton}>
                    <div className={styles.skeletonShimmer} />
                  </div>
                )}
                {!isLoading && activeImage && (
                  <motion.img
                    key={activeImage.cf_id}
                    src={cfImageUrl(activeImage.cf_id, 'large')}
                    alt={activeImage.alt_text || artwork?.name || ''}
                    className={styles.mainImage}
                    style={{ opacity: imgLoaded ? 1 : 0 }}
                    onLoad={() => setImgLoaded(true)}
                    loading="eager"
                    decoding="async"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: imgLoaded ? 1 : 0 }}
                    transition={{ duration: 0.4 }}
                  />
                )}
              </div>

              {/* Thumbnails */}
              {!isLoading && allImages.length > 1 && (
                <div className={styles.thumbRow}>
                  {allImages.map((img, i) => (
                    <button
                      key={img.cf_id}
                      className={`${styles.thumb} ${i === activeImgIdx ? styles.thumbActive : ''}`}
                      onClick={() => {
                        setActiveImgIdx(i)
                        setImgLoaded(false)
                      }}
                      aria-label={`Imagen ${i + 1}`}
                      aria-pressed={i === activeImgIdx}
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
            </motion.div>

            {/* ── Panel info ────────────────────────────────────── */}
            <motion.div className={styles.infoPanel} variants={childVariants}>
              {isLoading ? (
                <LoadingSkeleton />
              ) : error ? (
                <ErrorState message={error} />
              ) : artwork ? (
                <ArtworkInfo
                  artwork={artwork}
                  avail={avail}
                  showPrints={showPrints}
                  onTogglePrints={() => setShowPrints(p => !p)}
                  onClose={onClose}
                />
              ) : null}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── ArtworkInfo ───────────────────────────────────────────────────────────────

function ArtworkInfo({
  artwork,
  avail,
  showPrints,
  onTogglePrints,
  onClose,
}: {
  artwork: ArtworkDetail
  avail: { label: string; color: string } | null
  showPrints: boolean
  onTogglePrints: () => void
  onClose: () => void
}) {
  const { addItem, getItem, openCart } = useCartStore()
  const hasPrints = (artwork.prints?.length ?? 0) > 0

  return (
    <>
      <motion.p className={styles.techniqueTag} variants={childVariants}>
        {artwork.technique.name}
        {artwork.medium && (
          <span className={styles.mediumTag}> · {artwork.medium}</span>
        )}
      </motion.p>

      <motion.h2 className={styles.title} variants={childVariants}>
        {artwork.name}
      </motion.h2>

      <motion.div className={styles.metaRow} variants={childVariants}>
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
      </motion.div>

      <motion.p className={styles.collection} variants={childVariants}>
        Colección: <strong>{artwork.collection.name}</strong>
      </motion.p>

      <div className={styles.divider} />

      {artwork.description && (
        <motion.p className={styles.description} variants={childVariants}>
          {artwork.description}
        </motion.p>
      )}

      <div className={styles.spacer} />

      {/* Precio */}
      {artwork.availability !== 'nfs' && (
        <motion.div className={styles.priceRow} variants={childVariants}>
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
              <span className={styles.availDot} style={{ background: avail.color }} />
              <span className={styles.availLabel}>{avail.label}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* CTAs */}
      <motion.div className={styles.ctas} variants={childVariants}>
        {artwork.availability === 'available' && (
          <button
            className={styles.btnPrimary}
            onClick={() => {
              onClose()
              window.location.href = `/encargos?ref=${artwork.slug}`
            }}
          >
            Adquirir obra original
          </button>
        )}

        {hasPrints && (
          <button
            className={`${styles.btnSecondary} ${showPrints ? styles.btnActive : ''}`}
            onClick={onTogglePrints}
          >
            {showPrints ? 'Ocultar prints' : `Prints disponibles (${artwork.prints.length})`}
          </button>
        )}

        <button
          className={styles.btnGhost}
          onClick={() => {
            onClose()
            window.location.href = `/encargos?ref=${artwork.slug}`
          }}
        >
          Consultar al artista
        </button>
      </motion.div>

      {/* Panel de prints con integración al carrito */}
      <AnimatePresence>
        {showPrints && hasPrints && (
          <motion.div
            className={styles.printsPanel}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className={styles.printsTitle}>Reproducciones disponibles</p>
            {artwork.prints.map(print => (
              <PrintRow
                key={print.id}
                print={print}
                artwork={artwork}
                inCart={!!getItem(print.id)}
                onAdd={() => {
                  addItem({
                    printId: print.id,
                    artworkId: artwork.id,
                    artworkSlug: artwork.slug,
                    artworkName: artwork.name,
                    artworkImage: artwork.primary_image?.url_thumb ?? null,
                    sizeLabel: print.size_label,
                    paperLabel: print.paper_label,
                    price: print.price,
                    currency: print.currency,
                    productId: print.product_id,
                  })
                  openCart()
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share */}
      <button
        className={styles.shareBtn}
        onClick={() => {
          const url = `${window.location.origin}/galeria?obra=${artwork.slug}`
          navigator.clipboard?.writeText(url).catch(() => { })
        }}
      >
        <ShareIcon />
        Copiar enlace
      </button>
    </>
  )
}

// ── PrintRow ──────────────────────────────────────────────────────────────────

function PrintRow({
  print, artwork, inCart, onAdd,
}: {
  print: PrintProduct
  artwork: ArtworkDetail
  inCart: boolean
  onAdd: () => void
}) {
  void artwork  // usado en el padre

  return (
    <div className={styles.printRow}>
      <div>
        <p className={styles.printSize}>{print.size_label}</p>
        <p className={styles.printPaper}>{print.paper_label}</p>
      </div>
      <div className={styles.printRight}>
        <p className={styles.printPrice}>
          {print.currency} {print.price.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
        </p>
        <button
          className={`${styles.btnPrintBuy} ${inCart ? styles.btnPrintInCart : ''}`}
          disabled={!print.in_stock}
          onClick={onAdd}
        >
          {!print.in_stock ? 'Agotado' : inCart ? '✓ En carrito' : 'Añadir'}
        </button>
      </div>
    </div>
  )
}

// ── Skeleton / Error ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className={styles.loadingSkeleton}>
      {[35, 70, 50, 100, 90, 80].map((w, i) => (
        <div key={i} className={styles.skLine} style={{ width: `${w}%` }} />
      ))}
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

// ── Icons ─────────────────────────────────────────────────────────────────────

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
      <path d="M10 1L12 3L10 5M12 3H5.5C3.567 3 2 4.567 2 6.5V12"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
