import { GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { getTechniques, getArtworks, getExhibitions } from '@/lib/odoo-client'
import type { Technique, Artwork, Exhibition } from '@/lib/types'
import HeroSection from '@/components/hero/HeroSection'
import EventsSection from '@/components/exhibition/EventsSection'
import styles from './Home.module.css'

interface HomeProps {
  techniques:          Technique[]
  featuredArtworks:    Artwork[]
  upcomingExhibitions: Exhibition[]
}

export default function Home({ techniques, featuredArtworks, upcomingExhibitions }: HomeProps) {
  return (
    <>
      <Head>
        <title>Casa Janus — Galería de Arte Contemporáneo</title>
        <meta
          name="description"
          content="Casa Janus. Galería de arte contemporáneo en México. Obra original, encargos y exposiciones."
        />
        <meta property="og:title"       content="Casa Janus — Galería de Arte Contemporáneo" />
        <meta property="og:description" content="Espacio de creación, colección y encuentro" />
        <meta property="og:type"        content="website" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/`} />
      </Head>

      <main className={styles.main}>

        <HeroSection />

        {/* ── Sección dividida: Obras + Técnicas ─────────────── */}
        {(featuredArtworks.length > 0 || techniques.length > 0) && (
          <section className={styles.splitSection}>
            {/* LEFT — Obras destacadas */}
            <div className={styles.splitLeft}>
              <div className={styles.splitHeader}>
                <span className={styles.sectionLabel}>SELECCIÓN</span>
                <h2 className={styles.sectionTitle}>Obras destacadas</h2>
              </div>

              {featuredArtworks.length > 0 && (
                <>
                  <div className={styles.featuredGrid}>
                    {featuredArtworks.slice(0, 4).map((artwork) => (
                      <Link
                        key={artwork.id}
                        href={`/galeria?obra=${artwork.slug}`}
                        className={styles.featuredCard}
                      >
                        <div
                          className={styles.featuredImg}
                          style={{ aspectRatio: `1 / ${artwork.dimensions.aspect_ratio ?? 1.2}` }}
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
                          <span className={styles.featuredBadge}>DESTACADA</span>
                        </div>
                        <div className={styles.featuredInfo}>
                          <p className={styles.featuredTitle}>{artwork.name}</p>
                          <p className={styles.featuredYear}>{artwork.year}</p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className={styles.splitCta}>
                    <Link href="/galeria" className={styles.ctaLink}>
                      VER TODAS LAS OBRAS →
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* RIGHT — Técnicas */}
            <div className={styles.splitRight}>
              <div className={styles.splitHeader}>
                <span className={styles.sectionLabel}>EXPLORAR POR</span>
                <h2 className={styles.sectionTitle}>Técnicas</h2>
              </div>

              {techniques.length > 0 && (
                <div className={styles.techniquesGrid}>
                  {techniques.map((tech) => (
                    <Link
                      key={tech.id}
                      href={`/galeria?tecnica=${tech.slug}`}
                      className={styles.techCard}
                    >
                      <div className={styles.techTopLine} />
                      <h3 className={styles.techName}>{tech.name}</h3>
                      {tech.description && (
                        <p className={styles.techDesc}>{tech.description}</p>
                      )}
                      <span className={styles.techCount}>{tech.artwork_count} OBRAS →</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Eventos / Exposiciones ────────────────────────── */}
        <EventsSection exhibitions={upcomingExhibitions} />

        {/* ── Visión del artista ────────────────────────────── */}
        <section className={styles.ownerVision} id="vision">
          <div className={styles.ownerVisionInner}>
            <p className={styles.ownerVisionEyebrow}>El artista detrás del espacio</p>
            <h2 className={styles.ownerVisionName}>Israel Cortés · Janus</h2>
            <blockquote className={styles.ownerVisionQuote}>
              "La textura tiene alma, emoción, cierta fragilidad."
            </blockquote>
            <p className={styles.ownerVisionExcerpt}>
              Exploración del diálogo entre lo abstracto y lo figurativo,
              lo geométrico y lo orgánico — desde una memoria visual
              profundamente mexicana.
            </p>
            <Link href="/artista" className={styles.ctaSecondary}>
              Conocer al artista
            </Link>
          </div>
        </section>

        {/* ── Contacto ─────────────────────────────────────── */}
        <section className={styles.contact}>
          <div className={styles.contactInner}>
            <h2 className={styles.contactTitle}>¿Interesado en una obra?</h2>
            <p className={styles.contactText}>
              Consulta disponibilidad o solicita un encargo personalizado.
            </p>
            <div className={styles.contactCtas}>
              <Link href="/encargos" className={styles.heroCta}>
                Contactar al artista
              </Link>
              <Link href="/biography#contacto" className={styles.ctaSecondary}>
                Conocer más
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    const [techniques, featuredResult, allExhibitions] = await Promise.all([
      getTechniques(),
      getArtworks({ featured: true, perPage: 4 }),
      getExhibitions({ state: 'all', limit: 10 }),
    ])

    const upcomingExhibitions = allExhibitions
      .filter(e => e.state === 'upcoming' || e.state === 'active')
      .slice(0, 3)

    return {
      props: {
        techniques,
        featuredArtworks: featuredResult.data,
        upcomingExhibitions,
      },
      revalidate: 600,
    }
  } catch {
    return {
      props: { techniques: [], featuredArtworks: [], upcomingExhibitions: [] },
      revalidate: 60,
    }
  }
}
