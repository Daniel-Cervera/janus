/**
 * pages/tienda/checkout.tsx
 *
 * Página de checkout para prints del carrito.
 * Los items vienen de cartStore (Zustand + localStorage).
 * Si el carrito está vacío, redirige a /tienda.
 */

import { useState, useEffect } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCartStore } from '@/store/cartStore'
import styles from './Checkout.module.css'

const CheckoutPage: NextPage = () => {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCartStore()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Si carrito vacío → redirigir a /tienda
  useEffect(() => {
    if (items.length === 0) {
      router.replace('/tienda')
    }
  }, [items.length, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer: { name, email, phone: phone || undefined },
          items: items.map(item => ({
            product_id: item.productId,
            print_id: item.printId,
            artwork_id: item.artworkId,
            artwork_slug: item.artworkSlug,
            artwork_name: item.artworkName,
            size_label: item.sizeLabel,
            paper_label: item.paperLabel,
            quantity: item.quantity,
            price: item.price,
            currency: item.currency,
          })),
          notes: notes || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'No pudimos procesar tu orden. Por favor intenta de nuevo.')
        return
      }

      clearCart()
      router.push(`/tienda/confirmacion?order=${encodeURIComponent(data.order_name ?? data.order_id)}`)
    } catch {
      setError('Error de conexión. Por favor intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) return null

  const total = totalPrice()

  return (
    <>
      <Head>
        <title>Checkout — Casa Janus</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.header}>
            <p className={styles.label}>Tienda</p>
            <h1 className={styles.title}>Finalizar pedido</h1>
          </header>

          <div className={styles.layout}>
            {/* ── Resumen del pedido ──────────────────────── */}
            <section className={styles.summary}>
              <h2 className={styles.sectionTitle}>Tu selección</h2>
              <ul className={styles.itemList}>
                {items.map(item => (
                  <li key={item.printId} className={styles.item}>
                    {item.artworkImage && (
                      <img
                        src={item.artworkImage}
                        alt={item.artworkName}
                        className={styles.itemImg}
                      />
                    )}
                    <div className={styles.itemInfo}>
                      <p className={styles.itemName}>{item.artworkName}</p>
                      <p className={styles.itemMeta}>
                        {item.sizeLabel} · {item.paperLabel}
                      </p>
                      <p className={styles.itemQty}>Cantidad: {item.quantity}</p>
                    </div>
                    <p className={styles.itemPrice}>
                      {item.currency} {(item.price * item.quantity).toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                    </p>
                  </li>
                ))}
              </ul>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalPrice}>
                  MXN {total.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </section>

            {/* ── Formulario del comprador ─────────────────── */}
            <section className={styles.form}>
              <h2 className={styles.sectionTitle}>Tus datos</h2>
              <form onSubmit={handleSubmit} noValidate>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="name">
                    Nombre completo *
                  </label>
                  <input
                    id="name"
                    type="text"
                    className={styles.input}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    minLength={2}
                    autoComplete="name"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="email">
                    Correo electrónico *
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={styles.input}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="phone">
                    Teléfono (opcional)
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className={styles.input}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="notes">
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    id="notes"
                    className={styles.textarea}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                </div>

                {error && (
                  <p className={styles.errorMsg}>{error}</p>
                )}

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting}
                >
                  {submitting ? 'Procesando…' : 'Confirmar pedido'}
                </button>

                <p className={styles.disclaimer}>
                  Al confirmar, recibirás un correo con los detalles de tu pedido.
                  El artista se pondrá en contacto contigo para coordinar el envío.
                </p>
              </form>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}

export default CheckoutPage
