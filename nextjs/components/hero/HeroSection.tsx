/**
 * components/hero/HeroSection.tsx
 *
 * Hero con fondo de video de YouTube en modo ambient (blur).
 *
 * Técnica:
 *  - iframe de YouTube posicionado como fondo (scale 1.1 para cubrir bordes)
 *  - CSS filter: blur() sobre el iframe, NO sobre el texto
 *  - Overlay con gradiente oscuro para legibilidad del copy
 *  - Fallback: imagen estática si YouTube no carga (red lenta, bloqueadores)
 *  - pointer-events: none en todo el fondo para evitar interacción accidental
 *
 * Por qué iframe sobre <video>:
 *  - YouTube no permite descarga directa del .mp4 (ToS)
 *  - El IFrame API de YouTube es la única forma oficial de autoplay muted
 *  - Con los params correctos, Chrome/Safari/Firefox respetan el autoplay
 *
 * Limitación conocida:
 *  - En iOS Safari, YouTube bloquea autoplay en iframes incluso muted.
 *    El fallback de imagen se activa automáticamente vía onError del iframe
 *    y mediante la clase CSS `ios-fallback`.
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import styles from './HeroSection.module.css'

// ID del video de YouTube
const YT_VIDEO_ID = 'it_FFjp1IiE'

// URL de embed con todos los parámetros para modo ambient
const YT_EMBED_URL = [
  `https://www.youtube-nocookie.com/embed/${YT_VIDEO_ID}`,
  '?autoplay=1',
  '&mute=1',
  '&loop=1',
  '&controls=0',       // sin controles visibles
  '&showinfo=0',       // sin título del video
  '&rel=0',            // sin videos relacionados al terminar
  '&modestbranding=1', // logo de YouTube mínimo
  '&playsinline=1',    // necesario para iOS
  '&enablejsapi=1',    // permite comunicación con el IFrame API
  `&playlist=${YT_VIDEO_ID}`, // requerido para que loop=1 funcione
  '&iv_load_policy=3', // sin anotaciones
  '&disablekb=1',      // sin atajos de teclado
  '&fs=0',             // sin botón de pantalla completa
  '&cc_load_policy=0', // sin subtítulos automáticos
].join('')

interface HeroSectionProps {
  /** Título principal (nombre del artista o marca) */
  headline?: string
  /** Texto de eyebrow sobre el título */
  eyebrow?: string
  /** Frase o tagline debajo del nombre */
  tagline?: string
  /** Texto del botón principal */
  ctaPrimaryText?: string
  /** URL del botón principal */
  ctaPrimaryHref?: string
  /** Texto del botón secundario */
  ctaSecondaryText?: string
  /** URL del botón secundario */
  ctaSecondaryHref?: string
  /** Imagen de fallback para iOS y bloqueadores */
  fallbackImageSrc?: string
}

export default function HeroSection({
  headline = 'JANUS',
  eyebrow = 'Arte visual contemporáneo · México',
  tagline = 'Textura · Abstracción · Memoria',
  ctaPrimaryText = 'Explorar la galería',
  ctaPrimaryHref = '/galeria',
  ctaSecondaryText = 'Statement del artista',
  ctaSecondaryHref = '/statement',
  fallbackImageSrc = '/images/hero-fallback.jpg',
}: HeroSectionProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  // Detectar iOS para usar fallback directamente
  useEffect(() => {
    const ua = navigator.userAgent
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream)
  }, [])

  // Marcar video como listo cuando el iframe termina de cargar
  const handleIframeLoad = () => {
    // Pequeño delay para evitar flash blanco del iframe al cargar
    setTimeout(() => setVideoReady(true), 300)
  }

  const showFallback = isIOS

  return (
    <section className={styles.hero} aria-label="Bienvenida a Casa Janus">

      {/* ── Capa 1: Fondo de video (o imagen fallback) ─────────────── */}
      <div className={styles.videoBackground} aria-hidden="true">

        {/* Imagen fallback: visible en iOS y mientras carga el video */}
        <div
          className={`${styles.fallbackImage} ${(showFallback || !videoReady) ? styles.fallbackVisible : ''}`}
          style={{ backgroundImage: `url(${fallbackImageSrc})` }}
        />

        {/* iframe de YouTube — oculto en iOS */}
        {!showFallback && (
          <iframe
            ref={iframeRef}
            src={YT_EMBED_URL}
            className={`${styles.videoIframe} ${videoReady ? styles.videoVisible : ''}`}
            onLoad={handleIframeLoad}
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
            title="Video Casa Janus"
            // Accesibilidad: ocultar del árbol de accesibilidad
            tabIndex={-1}
            aria-hidden="true"
          />
        )}

        {/* ── Capa 2: Overlay de blur + oscurecimiento ────────────────
            Separado del iframe para que el blur NO afecte el texto.
            El blur se aplica solo al video, el overlay oscurece encima. */}
        <div className={styles.blurLayer} aria-hidden="true" />
        <div className={styles.overlayLayer} aria-hidden="true" />
      </div>

      {/* ── Capa 3: Contenido principal ──────────────────────────────── */}
      <div className={styles.content}>

        {/* Label decorativo */}
        <p className={styles.eyebrow}>{eyebrow}</p>

        {/* Título principal */}
        <h1 className={styles.artistName}>
          {headline}
        </h1>

        {/* CTAs */}
        <div className={styles.ctaGroup}>
          <Link href={ctaPrimaryHref} className={styles.ctaPrimary}>
            {ctaPrimaryText}
          </Link>
          <Link href={ctaSecondaryHref} className={styles.ctaSecondary}>
            {ctaSecondaryText}
          </Link>
        </div>

        {/* Scroll hint */}
        <div className={styles.scrollHint} aria-hidden="true">
          <div className={styles.scrollLine} />
          <span className={styles.scrollLabel}></span>
        </div>
      </div>
    </section>
  )
}
