/**
 * components/selection/SelectionDrawer.tsx
 *
 * Drawer lateral que muestra las obras seleccionadas por el usuario
 * y permite enviar una solicitud de información conjunta a Odoo.
 *
 * Flujo:
 *  Usuario selecciona obras → panel se abre →
 *  Rellena datos de contacto → POST /api/commission →
 *  Odoo crea encargo con lista de obras referenciadas
 */

'use client'

import { useState } from 'react'
import { useSelectionStore } from '@/store/selectionStore'
import styles from './SelectionDrawer.module.css'

type Step = 'list' | 'contact' | 'success'

export default function SelectionDrawer() {
  const {
    items, isDrawerOpen, closeDrawer,
    removeItem, clearAll, totalItems,
  } = useSelectionStore()

  const [step,    setStep]    = useState<Step>('list')
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setSending(true)
    setError('')

    const artworkRefs = items
      .map(i => `- ${i.name} (${i.year})`)
      .join('\n')

    const fullMessage = `Obras de interés:\n${artworkRefs}\n\n${message}`

    try {
      const res = await fetch('/api/commission', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_name: name,
          email,
          description: fullMessage,
          // IDs de obras para vincular en Odoo
          artwork_ids: items.map(i => i.id),
        }),
      })
      if (!res.ok) throw new Error('Error al enviar')
      setStep('success')
      clearAll()
    } catch {
      setError('No se pudo enviar. Por favor intenta de nuevo.')
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    closeDrawer()
    setStep('list')
    setName('')
    setEmail('')
    setMessage('')
    setError('')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isDrawerOpen ? styles.backdropOpen : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`${styles.drawer} ${isDrawerOpen ? styles.drawerOpen : ''}`}
        aria-label="Selección de obras"
        role="complementary"
      >
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Mi selección</h2>
            {totalItems() > 0 && (
              <p className={styles.subtitle}>{totalItems()} obra{totalItems() !== 1 ? 's' : ''}</p>
            )}
          </div>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Cerrar">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Steps indicator */}
        {step !== 'success' && items.length > 0 && (
          <div className={styles.steps}>
            <span className={`${styles.stepDot} ${step === 'list' ? styles.stepDotActive : styles.stepDotDone}`} />
            <span className={styles.stepLine} />
            <span className={`${styles.stepDot} ${step === 'contact' ? styles.stepDotActive : ''}`} />
          </div>
        )}

        {/* Body */}
        <div className={styles.body}>

          {/* STEP 1: Lista de obras seleccionadas */}
          {step === 'list' && (
            <>
              {items.length === 0 ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>◻</div>
                  <p className={styles.emptyTitle}>Sin obras seleccionadas</p>
                  <p className={styles.emptyText}>
                    Marca obras con el ícono de corazón para añadirlas aquí.
                  </p>
                </div>
              ) : (
                <>
                  <ul className={styles.list}>
                    {items.map(item => (
                      <li key={item.id} className={styles.item}>
                        {item.imageUrl && (
                          <div className={styles.itemImg}>
                            <img src={item.imageUrl} alt={item.name}
                                 className={styles.itemImgEl} loading="lazy" />
                          </div>
                        )}
                        <div className={styles.itemInfo}>
                          <p className={styles.itemName}>{item.name}</p>
                          <p className={styles.itemMeta}>{item.year} · {item.technique}</p>
                          {(item.price ?? 0) > 0 && (
                            <p className={styles.itemPrice}>
                              {item.currency} {(item.price ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                            </p>
                          )}
                        </div>
                        <button
                          className={styles.removeBtn}
                          onClick={() => removeItem(item.id)}
                          aria-label={`Quitar ${item.name}`}
                        >×</button>
                      </li>
                    ))}
                  </ul>

                  <div className={styles.listActions}>
                    <button className={styles.btnClear} onClick={clearAll}>
                      Limpiar selección
                    </button>
                    <button className={styles.btnPrimary} onClick={() => setStep('contact')}>
                      Solicitar información
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* STEP 2: Formulario de contacto */}
          {step === 'contact' && (
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <p className={styles.formIntro}>
                Te contactaré para hablar sobre{' '}
                {items.map(i => i.name).join(', ')}.
              </p>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="sel-name">
                  Nombre <span className={styles.req}>*</span>
                </label>
                <input
                  id="sel-name" type="text"
                  className={styles.input}
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Tu nombre" required autoComplete="name"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="sel-email">
                  Email <span className={styles.req}>*</span>
                </label>
                <input
                  id="sel-email" type="email"
                  className={styles.input}
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com" required autoComplete="email"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="sel-msg">
                  Mensaje <span className={styles.opt}>(opcional)</span>
                </label>
                <textarea
                  id="sel-msg" rows={3}
                  className={styles.textarea}
                  value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="¿Para qué espacio es? ¿Alguna pregunta específica?"
                />
              </div>

              {error && <p className={styles.errorMsg} role="alert">{error}</p>}

              <div className={styles.formActions}>
                <button type="button" className={styles.btnClear}
                        onClick={() => setStep('list')}>
                  ← Volver
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={sending}>
                  {sending ? (
                    <><span className={styles.spinner} /> Enviando...</>
                  ) : 'Enviar solicitud'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Éxito */}
          {step === 'success' && (
            <div className={styles.success}>
              <div className={styles.successCheck}>✓</div>
              <h3 className={styles.successTitle}>¡Solicitud enviada!</h3>
              <p className={styles.successText}>
                Revisaré tu selección y me pondré en contacto pronto.
              </p>
              <button className={styles.btnPrimary} onClick={handleClose}>
                Seguir explorando
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
