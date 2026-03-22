import { GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { getExhibitions } from '@/lib/odoo-client'
import type { Exhibition } from '@/lib/types'
import styles from './Exposiciones.module.css'

interface ExposicionesProps {
    exhibitions: Exhibition[]
}

const STATE_LABELS: Record<string, string> = {
    active: 'En curso',
    upcoming: 'Próxima',
    past: 'Pasada',
}

const STATE_COLORS: Record<string, string> = {
    active: '#22c55e',
    upcoming: '#f59e0b',
    past: '#6a6560',
}

export default function ExposicionesPage({ exhibitions }: ExposicionesProps) {
    const active = exhibitions.filter(e => e.state === 'active')
    const upcoming = exhibitions.filter(e => e.state === 'upcoming')
    const past = exhibitions.filter(e => e.state === 'past')

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

                <div className={styles.container}>
                    {exhibitions.length === 0 && (
                        <p className={styles.empty}>No hay exposiciones registradas aún.</p>
                    )}

                    {active.length > 0 && (
                        <ExhibitionGroup title="En curso" items={active} />
                    )}
                    {upcoming.length > 0 && (
                        <ExhibitionGroup title="Próximas" items={upcoming} />
                    )}
                    {past.length > 0 && (
                        <ExhibitionGroup title="Historial" items={past} />
                    )}
                </div>
            </main>
        </>
    )
}

function ExhibitionGroup({ title, items }: { title: string; items: Exhibition[] }) {
    return (
        <section className={styles.group}>
            <h2 className={styles.groupTitle}>{title}</h2>
            <div className={styles.list}>
                {items.map(ex => (
                    <article key={ex.id} className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div>
                                <h3 className={styles.cardName}>{ex.name}</h3>
                                <p className={styles.cardLocation}>{ex.location}</p>
                            </div>
                            <span
                                className={styles.stateBadge}
                                style={{ color: STATE_COLORS[ex.state] }}
                            >
                                {STATE_LABELS[ex.state] ?? ex.state}
                            </span>
                        </div>
                        {(ex.date_start || ex.date_end) && (
                            <p className={styles.cardDates}>
                                {ex.date_start && new Date(ex.date_start).toLocaleDateString('es-MX', {
                                    year: 'numeric', month: 'long', day: 'numeric',
                                })}
                                {ex.date_end && (
                                    <> — {new Date(ex.date_end).toLocaleDateString('es-MX', {
                                        year: 'numeric', month: 'long', day: 'numeric',
                                    })}</>
                                )}
                            </p>
                        )}
                        {ex.description && (
                            <p className={styles.cardDesc}>{ex.description}</p>
                        )}
                    </article>
                ))}
            </div>
        </section>
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