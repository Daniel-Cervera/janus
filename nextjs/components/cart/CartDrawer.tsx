/**
 * components/cart/CartDrawer.tsx
 *
 * Drawer (offcanvas) del carrito de prints.
 *
 * Animación: CSS transform + transition (sin dependencias extra).
 * Se desliza desde la derecha, con backdrop que bloquea el scroll.
 * Al confirmar orden, envía el payload directamente a Odoo.
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useCartStore, CartPrint } from '@/store/cartStore'
import styles from './CartDrawer.module.css'

export default function CartDrawer() {
  const {
    items, isOpen, closeCart,
    removeItem, updateQty, clearCart,
    totalItems, totalPrice,
  } = useCartStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted,    setSubmitted]    = useState(false)
  const [error,        setError]        = useState('')
  const drawerRef = useRef<HTMLDivElement>(null)

  // Focus trap: enfocar el drawer al abrir
  useEffect(() => {
    if (isOpen) {
      drawerRef.current?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeCart()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, closeCart])

  // ── Confirmar orden hacia Odoo ────────────────────────────────────────────
  const handleCheckout = async () => {
    if (items.length === 0 || isSubmitting) return
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/cart/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            product_id: i.productId,
            print_id:   i.printId,
            artwork_id: i.artworkId,
            quantity:   i.quantity,
            price:      i.price,
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Error al procesar la orden.')
      }

      setSubmitted(true)
      clearCart()
      setTimeout(() => {
        setSubmitted(false)
        closeCart()
      }, 3000)
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Ocurrió un error. Por favor intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de reproducciones"
        tabIndex={-1}
      >
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Carrito</h2>
            {totalItems() > 0 && (
              <p className={styles.subtitle}>{totalItems()} reproducción{totalItems() !== 1 ? 'es' : ''}</p>
            )}
          </div>
          <button
            className={styles.closeBtn}
            onClick={closeCart}
            aria-label="Cerrar carrito"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Contenido */}
        <div className={styles.body}>
          {submitted ? (
            <SuccessState />
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <ul className={styles.itemList}>
                {items.map(item => (
                  <CartItem
                    key={item.printId}
                    item={item}
                    onRemove={() => removeItem(item.printId)}
                    onQtyChange={(qty) => updateQty(item.printId, qty)}
                  />
                ))}
              </ul>

              {error && (
                <p className={styles.error} role="alert">{error}</p>
              )}
            </>
          )}
        </div>

        {/* Footer con total y CTA */}
        {items.length > 0 && !submitted && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalPrice}>
                {items[0]?.currency ?? 'USD'}{' '}
                {totalPrice().toLocaleString('es-MX', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <button
              className={styles.checkoutBtn}
              onClick={handleCheckout}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  Procesando...
                </>
              ) : (
                'Confirmar orden'
              )}
            </button>
            <button
              className={styles.clearBtn}
              onClick={clearCart}
              disabled={isSubmitting}
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function CartItem({
  item,
  onRemove,
  onQtyChange,
}: {
  item: CartPrint
  onRemove: () => void
  onQtyChange: (qty: number) => void
}) {
  return (
    <li className={styles.item}>
      {item.artworkImage && (
        <div className={styles.itemImg}>
          <img
            src={item.artworkImage}
            alt={item.artworkName}
            className={styles.itemImgEl}
            loading="lazy"
          />
        </div>
      )}
      <div className={styles.itemInfo}>
        <p className={styles.itemName}>{item.artworkName}</p>
        <p className={styles.itemDetail}>{item.sizeLabel} · {item.paperLabel}</p>
        <p className={styles.itemPrice}>
          {item.currency} {(item.price * item.quantity).toLocaleString('es-MX', {
            minimumFractionDigits: 0,
          })}
        </p>
      </div>
      <div className={styles.itemActions}>
        <div className={styles.qtyControl}>
          <button
            className={styles.qtyBtn}
            onClick={() => onQtyChange(item.quantity - 1)}
            aria-label="Reducir cantidad"
          >−</button>
          <span className={styles.qty}>{item.quantity}</span>
          <button
            className={styles.qtyBtn}
            onClick={() => onQtyChange(item.quantity + 1)}
            aria-label="Aumentar cantidad"
          >+</button>
        </div>
        <button
          className={styles.removeBtn}
          onClick={onRemove}
          aria-label="Eliminar del carrito"
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  )
}

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyTitle}>Tu carrito está vacío</p>
      <p className={styles.emptyText}>
        Explora la galería y añade reproducciones de las obras que te interesen.
      </p>
    </div>
  )
}

function SuccessState() {
  return (
    <div className={styles.successState}>
      <div className={styles.successIcon}>✓</div>
      <p className={styles.successTitle}>¡Orden confirmada!</p>
      <p className={styles.successText}>
        Nos pondremos en contacto contigo para coordinar el envío y pago.
      </p>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M5 3.5l.5 8M9 3.5l-.5 8"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}
