import Link from 'next/link'
import styles from './HeroSection.module.css'

export default function HeroSection() {
  return (
    <section className={styles.hero} aria-label="Bienvenida a Casa Janus">
      <div className={styles.content}>
        <p className={styles.eyebrow}>GALERÍA DE ARTE CONTEMPORÁNEO · MÉXICO</p>

        <h1 className={styles.headline}>
          <span className={styles.headlineWhite}>CASA</span>
          <span className={styles.headlineRed}>JANUS</span>
        </h1>

        <p className={styles.tagline}>Textura · Abstracción · Memoria</p>

        <div className={styles.ctaGroup}>
          <Link href="/galeria" className={styles.ctaPrimary}>
            EXPLORAR GALERÍA
          </Link>
          <Link href="/exposiciones" className={styles.ctaSecondary}>
            EXPOSICIONES
          </Link>
        </div>
      </div>

      <span className={styles.scrollHintLeft}>↓ SCROLL</span>
      <span className={styles.scrollHintRight}>ISRAEL CORTÉS · 2025</span>
    </section>
  )
}
