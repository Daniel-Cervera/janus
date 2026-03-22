/**
 * pages/index.tsx
 *
 * Landing page de Janus con:
 *  - Hero con video blur (HeroSection)
 *  - Botones con espaciado correcto (gap en flex)
 *  - CTA "Statement" navegando client-side a /biography
 *  - Obras destacadas y técnicas desde Odoo (ISR)
 */

import { GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { getTechniques, getArtworks } from '@/lib/odoo-client'
import type { Technique, Artwork } from '@/lib/types'
import HeroSection from '@/components/hero/HeroSection'
import styles from './Home.module.css'

interface HomeProps {
  techniques:       Technique[]
  featuredArtworks: Artwork[]
}

export default function Home({ techniques, featuredArtworks }: HomeProps) {
  return (
    <>
      <Head>
        <title>Janus — Arte Visual Contemporáneo</title>
        <meta
          name="description"
          content="Israel Cortés 'Janus'. Arte abstracto y figurativo. Textura, color y memoria."
        />
        <meta property="og:title"       content="Janus — Arte Visual Contemporáneo" />
        <meta property="og:description" content="Textura · Abstracción · Memoria" />
        <meta property="og:type"        content="website" />
        {/* URL canónica dinámica según entorno */}
        <link
          rel="canonical"
          href={`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/`}
        />
      </Head>

      <main className={styles.main}>

        {/* ── TAREA 1 y 2: Hero con video + botones corregidos ── */}
        {/*
          Los botones viven dentro de HeroSection.
          El espaciado se controla con gap en el ctaGroup.
          Ver HeroSection.module.css → .ctaGroup { gap: 16px }

          TAREA 3: el botón "Statement del artista" navega a /biography
          via client-side routing de Next.js (Link — sin recarga de página).
        */}
        <HeroSection
          artistName="Janus"
          tagline="Textura · Abstracción · Memoria"
          ctaPrimaryText="Explorar la galería"
          ctaPrimaryHref="/galeria"
          ctaSecondaryText="Statement del artista"
          ctaSecondaryHref="/biography"
          fallbackImageSrc="/images/hero-fallback.jpg"
        />

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

        {/* ── CTA hacia Statement/Biografía ─────────────────────── */}
        {/* Tarea 3: segundo punto de entrada a /biography */}
        <section className={styles.statementCta}>
          <div className={styles.statementInner}>
            <p className={styles.statementEyebrow}>Sobre el artista</p>
            <h2 className={styles.statementTitle}>
              "La textura tiene alma, emoción, cierta fragilidad."
            </h2>
            <p className={styles.statementExcerpt}>
              Israel Cortés explora el diálogo entre lo abstracto y lo figurativo,
              lo geométrico y lo orgánico, desde una memoria visual profundamente mexicana.
            </p>
            <Link href="/biography" className={styles.heroCta}>
              Leer el statement completo
            </Link>
          </div>
        </section>

        {/* ── Contacto ──────────────────────────────────────────── */}
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
