'use client'

import { useState } from 'react'
import { GetStaticProps } from 'next'
import Head from 'next/head'
import { getExhibitions } from '@/lib/odoo-client'
import type { Exhibition } from '@/lib/types'
import styles from './Exposiciones.module.css'

interface ExposicionesProps {
  exhibitions: Exhibition[]
}

type FilterTab = 'all' | 'upcoming' | 'active' | 'past'

const STATE_BADGE: Record<string, { label: string; cls: string }> = {
  active:   { label: 'EN CURSO',   cls: styles.badgeActive   },
  upcoming: { label: 'PRÓXIMA',    cls: styles.badgeUpcoming },
  past:     { label: 'FINALIZADA', cls: styles.badgePast     },
}

const TYPE_LABELS: Record<string, string> = {
  solo:       'INDIVIDUAL',
  collective: 'COLECTIVA',
  group:      'GRUPAL',
}

export default function ExposicionesPage({ exhibitions }: ExposicionesProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const filtered = activeTab === 'all'
    ? exhibitions
    : exhibitions.filter(e => e.state === activeTab)

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all',      label: 'TODAS'    },
    { key: 'upcoming', label: 'PRÓXIMAS' },
    { key: 'active',   label: 'EN CURSO' },
    { key: 'past',     label: 'PASADAS'  },
  ]

  return (
    <>
      <Head>
        <title>Exposiciones — Janus</title>
        <meta name="description" content="Exposiciones y muestras del artista visual Janus." />
      </Head>

      <main className={styles.page}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Trayectoria</p>
          <h1 className={styles.title}>Exposiciones</h1>
        </header>

        {/* ── Filter tabs ─────────────────────────────────── */}
        <nav className={styles.filterTabs} aria-label="Filtrar exposiciones">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`${styles.filterTab} ${activeTab === tab.key ? styles.filterTabActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className={styles.container}>
          {filtered.length === 0 && (
            <p className={styles.empty}>No hay exposiciones en esta categoría.</p>
          )}

          <div className={styles.list}>
            {filtered.map(ex => {
              const badge = STATE_BADGE[ex.state] ?? { label: ex.state?.toUpperCase(), cls: '' }
              const typeLabel = TYPE_LABELS[(ex as any).type] ?? null

              return (
                <article key={ex.id} className={styles.card}>
                  <div className={styles.cardLeft}>
                    <span className={styles.expoTag}>EXPO</span>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardTop}>
                      <h3 className={styles.cardName}>{ex.name}</h3>
                      <div className={styles.cardBadges}>
                        <span className={`${styles.stateBadge} ${badge.cls}`}>
                          {badge.label}
                        </span>
                        {typeLabel && (
                          <span className={styles.typeBadge}>{typeLabel}</span>
                        )}
                      </div>
                    </div>

                    <p className={styles.cardVenueDates}>
                      {ex.location}
                      {(ex.date_start || ex.date_end) && (
                        <>
                          {ex.location && ' · '}
                          {ex.date_start && new Date(ex.date_start).toLocaleDateString('es-MX', {
                            year: 'numeric', month: 'long', day: 'numeric',
                          })}
                          {ex.date_end && (
                            <> — {new Date(ex.date_end).toLocaleDateString('es-MX', {
                              year: 'numeric', month: 'long', day: 'numeric',
                            })}</>
                          )}
                        </>
                      )}
                    </p>

                    {ex.description && (
                      <p className={styles.cardDesc}>{ex.description}</p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps<ExposicionesProps> = async () => {
  try {
    const exhibitions = await getExhibitions({ state: 'all' })
    return { props: { exhibitions }, revalidate: 3600 }
  } catch {
    return { props: { exhibitions: [] }, revalidate: 60 }
  }
}
