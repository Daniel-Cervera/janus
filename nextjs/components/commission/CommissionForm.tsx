/**
 * components/commission/CommissionForm.tsx
 *
 * Formulario de encargo personalizado.
 * Conecta con /api/commission (proxy → Odoo).
 * Incluye:
 *  - Honeypot anti-spam (campo oculto "website")
 *  - Validación en cliente antes de enviar
 *  - Estado de carga, éxito y error
 *  - Selector de técnica cargado desde Odoo
 *  - Campo de obra de referencia (opcional, desde URL ?ref=)
 */

'use client'

import { useState, useRef } from 'react'
import styles from './CommissionForm.module.css'
import type { Technique, BudgetRange } from '@/lib/types'

interface CommissionFormProps {
  techniques?: Technique[]
  refArtworkSlug?: string   // pre-rellenado desde ?ref= en la URL
  refArtworkId?: number
  refArtworkName?: string
}

interface FormState {
  partner_name: string
  email: string
  phone: string
  description: string
  budget_range: BudgetRange | ''
  technique_id: string
  // Honeypot — debe permanecer vacío
  website: string
}

const BUDGET_OPTIONS: { value: BudgetRange; label: string }[] = [
  { value: 'lt500', label: 'Menos de $500' },
  { value: '500_1500', label: '$500 – $1,500' },
  { value: '1500_5k', label: '$1,500 – $5,000' },
  { value: '5k_15k', label: '$5,000 – $15,000' },
  { value: 'gt15k', label: 'Más de $15,000' },
]

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

export default function CommissionForm({
  techniques = [],
  refArtworkId,
  refArtworkName,
}: CommissionFormProps) {
  const [form, setForm] = useState<FormState>({
    partner_name: '',
    email: '',
    phone: '',
    description: '',
    budget_range: '',
    technique_id: '',
    website: '',  // honeypot
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {}

    if (!form.partner_name.trim())
      newErrors.partner_name = 'El nombre es requerido.'
    if (!form.email.trim())
      newErrors.email = 'El email es requerido.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'El email no tiene un formato válido.'
    if (!form.description.trim())
      newErrors.description = 'Por favor describe tu encargo.'
    else if (form.description.trim().length < 30)
      newErrors.description = 'Por favor añade más detalles (al menos 30 caracteres).'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setStatus('submitting')
    setErrorMessage('')

    try {
      const payload: Record<string, unknown> = {
        partner_name: form.partner_name.trim(),
        email: form.email.trim().toLowerCase(),
        description: form.description.trim(),
        website: form.website,  // honeypot
      }

      if (form.phone.trim()) payload.phone = form.phone.trim()
      if (form.budget_range) payload.budget_range = form.budget_range
      if (form.technique_id) payload.technique_id = parseInt(form.technique_id)
      if (refArtworkId) payload.ref_artwork_id = refArtworkId

      const res = await fetch('/api/commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors)
          setStatus('idle')
          return
        }
        throw new Error(data.error ?? 'Error desconocido')
      }

      setStatus('success')
      formRef.current?.reset()
      setForm({
        partner_name: '', email: '', phone: '',
        description: '', budget_range: '', technique_id: '', website: '',
      })
    } catch (err) {
      setStatus('error')
      setErrorMessage(
        (err as Error).message ||
        'No pudimos procesar tu solicitud. Por favor intenta de nuevo.'
      )
    }
  }

  if (status === 'success') {
    return (
      <div className={styles.successState}>
        <div className={styles.successIcon} aria-hidden="true">✓</div>
        <h3 className={styles.successTitle}>Solicitud recibida</h3>
        <p className={styles.successText}>
          Gracias por tu interés. Nos pondremos en contacto contigo en breve
          para hablar sobre tu encargo.
        </p>
        <button
          className={styles.btnReset}
          onClick={() => setStatus('idle')}
        >
          Enviar otra solicitud
        </button>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={styles.form}
      noValidate
    >
      {/* Referencia de obra */}
      {refArtworkName && (
        <div className={styles.refBanner}>
          <span className={styles.refLabel}>Obra de referencia</span>
          <span className={styles.refName}>{refArtworkName}</span>
        </div>
      )}

      {/* Honeypot — invisible para humanos */}
      <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true">
        <label htmlFor="website">No llenar</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={set('website')}
        />
      </div>

      {/* ── Campos ───────────────────────────────────────────── */}
      <div className={styles.row}>
        <Field
          label="Nombre *"
          error={errors.partner_name}
        >
          <input
            type="text"
            className={`${styles.input} ${errors.partner_name ? styles.inputError : ''}`}
            placeholder="Tu nombre completo"
            value={form.partner_name}
            onChange={set('partner_name')}
            autoComplete="name"
            required
          />
        </Field>
      </div>

      <div className={styles.rowTwo}>
        <Field label="Email *" error={errors.email}>
          <input
            type="email"
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            placeholder="correo@ejemplo.com"
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Teléfono">
          <input
            type="tel"
            className={styles.input}
            placeholder="+52 (opcional)"
            value={form.phone}
            onChange={set('phone')}
            autoComplete="tel"
          />
        </Field>
      </div>

      <div className={styles.rowTwo}>
        <Field label="Técnica preferida">
          <select
            className={styles.select}
            value={form.technique_id}
            onChange={set('technique_id')}
          >
            <option value="">Sin preferencia</option>
            {(techniques ?? []).map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Presupuesto estimado">
          <select
            className={styles.select}
            value={form.budget_range}
            onChange={set('budget_range')}
          >
            <option value="">Seleccionar...</option>
            {BUDGET_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Descripción del encargo *" error={errors.description}>
        <textarea
          className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
          placeholder="Describe lo que tienes en mente: tamaño aproximado, temática, colores, espacio donde irá, uso previsto..."
          rows={5}
          value={form.description}
          onChange={set('description')}
          required
        />
        <span className={styles.charCount}>
          {form.description.length} caracteres
        </span>
      </Field>

      {/* Error global */}
      {status === 'error' && (
        <div className={styles.errorBanner} role="alert">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        className={styles.btnSubmit}
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            Enviando...
          </>
        ) : (
          'Enviar solicitud'
        )}
      </button>

      <p className={styles.privacyNote}>
        Tu información es privada y no será compartida con terceros.
        Solo se usará para responder a tu solicitud.
      </p>
    </form>
  )
}

// ── Sub-componente Field ───────────────────────────────────────────────────────
function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
      {error && (
        <span className={styles.fieldError} role="alert">{error}</span>
      )}
    </div>
  )
}

