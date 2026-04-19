import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import styles from './HeroSection.module.css'

const YT_VIDEO_ID = 'it_FFjp1IiE'

const YT_EMBED_URL = [
  `https://www.youtube-nocookie.com/embed/${YT_VIDEO_ID}`,
  '?autoplay=1',
  '&mute=1',
  '&loop=1',
  '&controls=0',
  '&showinfo=0',
  '&rel=0',
  '&modestbranding=1',
  '&playsinline=1',
  '&enablejsapi=1',
  `&playlist=${YT_VIDEO_ID}`,
  '&iv_load_policy=3',
  '&disablekb=1',
  '&fs=0',
  '&cc_load_policy=0',
].join('')

export default function HeroSection() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream)
  }, [])

  const handleIframeLoad = () => {
    setTimeout(() => setVideoReady(true), 300)
  }

  const showFallback = isIOS

  return (
    <section className={styles.hero} aria-label="Bienvenida a Casa Janus">

      {/* ── Fondo de video ─────────────────────────────────────── */}
      <div className={styles.videoBackground} aria-hidden="true">
        <div
          className={`${styles.fallbackImage} ${(showFallback || !videoReady) ? styles.fallbackVisible : ''}`}
          style={{ backgroundImage: 'url(/images/hero-fallback.jpg)' }}
        />

        {!showFallback && (
          <iframe
            ref={iframeRef}
            src={YT_EMBED_URL}
            className={`${styles.videoIframe} ${videoReady ? styles.videoVisible : ''}`}
            onLoad={handleIframeLoad}
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
            title="Video Casa Janus"
            tabIndex={-1}
            aria-hidden="true"
          />
        )}

        <div className={styles.blurLayer} aria-hidden="true" />
        <div className={styles.overlayLayer} aria-hidden="true" />
      </div>

      {/* ── Contenido ─────────────────────────────────────────── */}
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
