/**
 * pages/biography/index.tsx
 *
 * Página de Statement / Biografía del artista Janus.
 *
 * TAREA 3: Ruta /biography con client-side routing.
 * TAREA 4: Formulario al final que crea un Lead en Odoo CRM.
 *
 * Estructura de la página:
 *  1. Hero editorial (frase del manifiesto)
 *  2. Texto del statement completo
 *  3. Foto del artista
 *  4. Datos biográficos
 *  5. Formulario de contacto → /api/odoo/lead
 */

import Head from 'next/head'
import Link from 'next/link'
import styles from './Biography.module.css'
import LeadForm from '@/components/forms/LeadForm'

export default function BiographyPage() {
  return (
    <>
      <Head>
        <title>Statement — Janus</title>
        <meta
          name="description"
          content="Israel Cortés 'Janus'. Mi búsqueda surge de la necesidad de crear, y me dirige hacia un lenguaje plástico misterioso: la textura."
        />
        <meta property="og:title" content="Statement — Janus" />
        <meta property="og:description" content="Arte visual contemporáneo. Textura, abstracción, memoria." />
      </Head>

      <main className={styles.page}>

        {/* ── Navegación de regreso ────────────────────────────── */}
        <nav className={styles.backNav}>
          <Link href="/" className={styles.backLink}>
            ← Inicio
          </Link>
        </nav>

        {/* ── Hero editorial ───────────────────────────────────── */}
        <header className={styles.hero}>
          <div className={styles.heroInner}>
            <p className={styles.eyebrow}>Israel Cortés · México · 1990</p>
            <h1 className={styles.heroTitle}>Janus</h1>
            <p className={styles.heroQuote}>
              "La textura tiene alma, emoción, cierta fragilidad."
            </p>
          </div>
        </header>

        {/* ── Statement completo ───────────────────────────────── */}
        <section className={styles.statementSection}>
          <div className={styles.container}>
            <div className={styles.statementGrid}>

              {/* Columna de texto */}
              <div className={styles.statementText}>
                <h2 className={styles.statementHeading}>Statement</h2>

                <p className={styles.paragraph}>
                  Mi búsqueda surge de la necesidad de crear, y me dirige hacia un lenguaje
                  plástico misterioso: la textura. Para mí, tiene alma, emoción, cierta
                  fragilidad. Imagino un diálogo entre lo abstracto y lo figurativo, lo
                  geométrico y lo orgánico.
                </p>

                <p className={styles.paragraph}>
                  Personajes y sus historias que se encuentran yaciendo en las texturas del
                  material, y solo necesito encontrarlas… pero todo surge de mis recuerdos,
                  mis experiencias.
                </p>

                <p className={styles.paragraph}>
                  Lo visual siempre fue mi primer lenguaje, antes que el idioma o las palabras:
                  el paisaje, los colores, las formas, las plantas, la playa; los animales y
                  todas las cosas… y eso se ha quedado en mi bolsillo. En un imaginario personal
                  recurriendo a lo simbólico y popular de la cultura mexicana.
                </p>

                <p className={styles.paragraph}>
                  Considera que su obra es abstracta figurativa, basada en una proyección de
                  símbolos del subconsciente motivados por su realidad inmediata, con trazos de
                  figuras básicas, colores y vibraciones que invitan a una realidad interior.
                </p>
              </div>

              {/* Columna de imagen */}
              <div className={styles.statementMedia}>
                <div className={styles.artistPhoto}>
                  {/* Reemplazar con imagen real del artista */}
                  <img
                    src="/images/janus-portrait.jpg"
                    alt="Israel Cortés — Janus, artista visual"
                    className={styles.artistImg}
                    loading="lazy"
                    onError={(e) => {
                      // Fallback si no existe la imagen
                      const el = e.currentTarget
                      el.style.display = 'none'
                    }}
                  />
                  <div className={styles.photoCaption}>
                    <span className={styles.captionName}>Israel Cortés "Janus"</span>
                    <span className={styles.captionDesc}>Artista visual · Mexicano · 1990</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Influencias ──────────────────────────────────────── */}
        <section className={styles.influencesSection}>
          <div className={styles.container}>
            <h2 className={styles.influencesHeading}>Influencias</h2>
            <ul className={styles.influencesList}>
              {[
                'Manuel Felguerez',
                'David Alfaro Siqueiros',
                'Rufino Tamayo',
                'Bernard Buffet',
                'Egon Schiele',
                'Jean Charlot',
              ].map(name => (
                <li key={name} className={styles.influenceItem}>{name}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── TAREA 4: Formulario → Odoo CRM Lead ──────────────── */}
        <section id="contacto" className={styles.contactSection}>
          <div className={styles.container}>
            <div className={styles.contactGrid}>

              <div className={styles.contactInfo}>
                <p className={styles.contactEyebrow}>Contacto directo</p>
                <h2 className={styles.contactTitle}>
                  ¿Quieres adquirir una obra o hacer una consulta?
                </h2>
                <p className={styles.contactText}>
                  Escríbeme directamente. Respondo personalmente a cada mensaje
                  para hablar sobre disponibilidad, encargos o exposiciones.
                </p>
                <div className={styles.contactDetails}>
                  <a href="https://www.instagram.com/janus_cp/" className={styles.socialLink}
                    target="_blank" rel="noopener noreferrer">
                    Instagram: @janus_cp
                  </a>
                  <a href="https://www.facebook.com/janusvisualartist/" className={styles.socialLink}
                    target="_blank" rel="noopener noreferrer">
                    Facebook: Janus Visual Artist
                  </a>
                </div>
              </div>

              {/* El formulario se conecta a /api/odoo/lead */}
              <LeadForm />

            </div>
          </div>
        </section>

      </main>
    </>
  )
}
