import { GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { getTechniques, getArtworks } from '@/lib/odoo-client'
import type { Technique, Artwork } from '@/lib/types'
import styles from './Home.module.css'

interface HomeProps {
  techniques: Technique[]
  featuredArtworks: Artwork[]
}

export default function Home({ techniques, featuredArtworks }: HomeProps) {
  return (
    <>
      <Head>
        <title>Casa Janus — Galería de Arte</title>
        <meta name="description" content="Galería de arte contemporáneo. Explora obras únicas por técnica y colección." />
      </Head>

      <main className={styles.main}>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.heroLabel}>Galería de Arte</p>
            <h1 className={styles.heroTitle}>Casa Janus</h1>
            <p className={styles.heroSub}>
              Obras únicas que dialogan entre la tradición y lo contemporáneo.
            </p>
            <Link href="/galeria" className={styles.heroCta}>
              Explorar la colección
            </Link>
          </div>
        </section>

        {/* ── Obras destacadas ──────────────────────────────────── */}
        {featuredArtworks.length > 0 && (
          <section className={styles.featured}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>Selección</span>
              <h2 className={styles.sectionTitle}>Obras destacadas</h2>
            </div>
            <div className={styles.featuredGrid}>
              {featuredArtworks.slice(0, 6).map((artwork) => (
                <Link
                  key={artwork.id}
                  href={`/galeria?obra=${artwork.slug}`}
                  className={styles.featuredCard}
                >
                  <div
                    className={styles.featuredImg}
                    style={{ aspectRatio: `1 / ${artwork.dimensions.aspect_ratio}` }}
                  >
                    {artwork.primary_image?.url ? (
                      <img
                        src={artwork.primary_image.url_medium || artwork.primary_image.url || ''}
                        alt={artwork.name}
                        className={styles.featuredImgEl}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.imgPlaceholder} />
                    )}
                  </div>
                  <div className={styles.featuredInfo}>
                    <p className={styles.featuredTitle}>{artwork.name}</p>
                    <p className={styles.featuredYear}>{artwork.year}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className={styles.sectionCta}>
              <Link href="/galeria" className={styles.ctaSecondary}>
                Ver todas las obras
              </Link>
            </div>
          </section>
        )}

        {/* ── Técnicas ──────────────────────────────────────────── */}
        {techniques.length > 0 && (
          <section className={styles.techniques}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>Explorar por</span>
              <h2 className={styles.sectionTitle}>Técnicas</h2>
            </div>
            <div className={styles.techniquesGrid}>
              {techniques.map((tech) => (
                <Link
                  key={tech.id}
                  href={`/galeria?tecnica=${tech.slug}`}
                  className={styles.techCard}
                >
                  <h3 className={styles.techName}>{tech.name}</h3>
                  <p className={styles.techCount}>{tech.artwork_count} obras</p>
                  {tech.description && (
                    <p className={styles.techDesc}>{tech.description}</p>
                  )}
                  <span className={styles.techArrow}>→</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Contacto ──────────────────────────────────────────── */}
        <section className={styles.contact}>
          <div className={styles.contactInner}>
            <h2 className={styles.contactTitle}>¿Interesado en una obra?</h2>
            <p className={styles.contactText}>
              Consulta disponibilidad o solicita un encargo personalizado.
            </p>
            <Link href="/encargos" className={styles.heroCta}>
              Contactar al artista
            </Link>
          </div>
        </section>

      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    const [techniques, featuredResult] = await Promise.all([
      getTechniques(),
      getArtworks({ featured: true, perPage: 6 }),
    ])

    return {
      props: {
        techniques,
        featuredArtworks: featuredResult.data,
      },
      revalidate: 600,
    }
  } catch {
    return {
      props: { techniques: [], featuredArtworks: [] },
      revalidate: 60,
    }
  }
}
