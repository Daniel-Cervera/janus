'use client'

import { useState } from 'react'
import styles from './LeadForm.module.css'

interface FormState {
  name:    string
  email:   string
  phone:   string
  message: string
  website: string
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

function validateClient(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.name.trim() || form.name.trim().length < 2)
    errors.name = 'El nombre debe tener al menos 2 caracteres.'
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = 'Introduce un email válido.'
  if (!form.message.trim() || form.message.trim().length < 10)
    errors.message = 'El mensaje debe tener al menos 10 caracteres.'
  return errors
}

export default function LeadForm() {
  const [form, setForm] = useState<FormState>({
    name: '', email: '', phone: '', message: '', website: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [status,      setStatus]      = useState<SubmitStatus>('idle')
  const [errorMsg,    setErrorMsg]    = useState('')

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      if (fieldErrors[field]) {
        setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n })
      }
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const clientErrors = validateClient(form)
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      return
    }
    setStatus('submitting')
    setErrorMsg('')
    setFieldErrors({})
    try {
      const res  = await fetch('/api/odoo/lead', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.errors) { setFieldErrors(data.errors); setStatus('idle'); return }
        throw new Error(data.error ?? 'Error desconocido.')
      }
      setStatus('success')
      setForm({ name: '', email: '', phone: '', message: '', website: '' })
    } catch (err: unknown) {
      setStatus('error')
      setErrorMsg((err as Error).message || 'No pudimos enviar tu mensaje. Intenta de nuevo.')
    }
  }

  if (status === 'success') {
    return (
      <div className={styles.successState} role="alert">
        <div className={styles.successIcon} aria-hidden="true">✓</div>
        <h3 className={styles.successTitle}>¡Mensaje enviado!</h3>
        <p className={styles.successText}>
          Gracias por escribirme. Respondo personalmente a cada mensaje en menos de 48 horas.
        </p>
        <button className={styles.resetBtn} onClick={() => setStatus('idle')}>
          Enviar otro mensaje
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>

      {/* Honeypot anti-bot */}
      <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true">
        <input
          name="website" type="text" tabIndex={-1} autoComplete="off"
          value={form.website} onChange={set('website')}
        />
      </div>

      {/* Nombre */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="lead-name">
          Nombre <span className={styles.required}>*</span>
        </label>
        <input
          id="lead-name" type="text"
          className={`${styles.input} ${fieldErrors.name ? styles.inputError : ''}`}
          placeholder="Tu nombre completo"
          value={form.name} onChange={set('name')}
          autoComplete="name" required
        />
        {fieldErrors.name && (
          <span className={styles.fieldError} role="alert">{fieldErrors.name}</span>
        )}
      </div>

      {/* Email + Teléfono */}
      <div className={styles.rowTwo}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="lead-email">
            Email <span className={styles.required}>*</span>
          </label>
          <input
            id="lead-email" type="email"
            className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
            placeholder="tu@email.com"
            value={form.email} onChange={set('email')}
            autoComplete="email" required
          />
          {fieldErrors.email && (
            <span className={styles.fieldError} role="alert">{fieldErrors.email}</span>
          )}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="lead-phone">
            Teléfono <span className={styles.optional}>(opcional)</span>
          </label>
          <input
            id="lead-phone" type="tel"
            className={styles.input}
            placeholder="+52 (000) 000-0000"
            value={form.phone} onChange={set('phone')}
            autoComplete="tel"
          />
        </div>
      </div>

      {/* Mensaje */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="lead-message">
          Mensaje <span className={styles.required}>*</span>
        </label>
        <textarea
          id="lead-message" rows={5}
          className={`${styles.textarea} ${fieldErrors.message ? styles.inputError : ''}`}
          placeholder="Cuéntame qué obra te interesa, si quieres hacer un encargo, o simplemente saluda..."
          value={form.message} onChange={set('message')} required
        />
        <span className={styles.charCount}>{form.message.length} / 2000</span>
        {fieldErrors.message && (
          <span className={styles.fieldError} role="alert">{fieldErrors.message}</span>
        )}
      </div>

      {status === 'error' && (
        <div className={styles.errorBanner} role="alert">{errorMsg}</div>
      )}

      <button
        type="submit" className={styles.submitBtn}
        disabled={status === 'submitting'} aria-busy={status === 'submitting'}
      >
        {status === 'submitting' ? (
          <><span className={styles.spinner} aria-hidden="true" /> Enviando...</>
        ) : 'Enviar mensaje'}
      </button>

      <p className={styles.privacyNote}>
        Tu información es privada y solo se usa para responder tu consulta.
      </p>
    </form>
  )
}
