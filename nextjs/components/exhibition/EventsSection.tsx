/**
 * components/exhibition/EventsSection.tsx
 *
 * Sección de exposiciones para la landing page.
 * Muestra hasta 3 exposiciones upcoming/active con card visual.
 * Retorna null si no hay exposiciones para no renderizar la sección vacía.
 */

import Link from 'next/link'
import type { Exhibition } from '@/lib/types'
import styles from './EventsSection.module.css'

interface EventsSectionProps {
  exhibitions: Exhibition[]
}

function formatDateRange(start?: string | null, end?: string | null): string {
  if (!start) return ''
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  if (!end) return fmt(start)
  return `${fmt(start)} — ${fmt(end)}`
}

export default function EventsSection({ exhibitions }: EventsSectionProps) {
  if (exhibitions.length === 0) return null

  return (
    <section className={styles.events} id="eventos">
      <div className={styles.header}>
        <span className={styles.label}>Agenda</span>
        <h2 className={styles.title}>Exposiciones</h2>
      </div>

      <div className={styles.grid}>
        {exhibitions.map((exhibition) => (
          <article key={exhibition.id} className={styles.card}>
            {/* Imagen de portada */}
            <div className={styles.cardImage}>
              {exhibition.cover_image ? (
                <img
                  src={exhibition.cover_image}
                  alt={exhibition.name}
                  className={styles.cardImg}
                  loading="lazy"
                />
              ) : (
                <div className={styles.cardImgPlaceholder} />
              )}
              <span
                className={`${styles.badge} ${
                  exhibition.state === 'active' ? styles.badgeActive : styles.badgeUpcoming
                }`}
              >
                {exhibition.state === 'active' ? 'Activa' : 'Próxima'}
              </span>
            </div>

            {/* Info */}
            <div className={styles.cardBody}>
              <h3 className={styles.cardName}>{exhibition.name}</h3>

              {(exhibition.date_start || exhibition.date_end) && (
                <p className={styles.cardDates}>
                  {formatDateRange(exhibition.date_start, exhibition.date_end)}
                </p>
              )}

              {(exhibition.location || exhibition.city) && (
                <p className={styles.cardLocation}>
                  {[exhibition.location, exhibition.city].filter(Boolean).join(', ')}
                </p>
              )}

              {exhibition.artwork_count > 0 && (
                <p className={styles.cardCount}>{exhibition.artwork_count} obras</p>
              )}

              {exhibition.slug && (
                <Link
                  href={`/exposiciones/${exhibition.slug}`}
                  className={styles.cardLink}
                >
                  Ver exposición →
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className={styles.cta}>
        <Link href="/exposiciones" className={styles.ctaLink}>
          Ver todas las exposiciones
        </Link>
      </div>
    </section>
  )
}
