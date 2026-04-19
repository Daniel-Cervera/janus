import { GetStaticProps } from 'next'
import Head from 'next/head'
import { getArtist } from '@/lib/odoo-client'
import type { Artist } from '@/lib/types'
import styles from './Artista.module.css'

interface ArtistaProps {
  artist: Artist | null
}

function sanitizeForNextJs(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj ?? null
  if (Array.isArray(obj)) return obj.map(sanitizeForNextJs)
  const newObj: any = {}
  for (const key in obj) {
    newObj[key] = obj[key] === undefined ? null : sanitizeForNextJs(obj[key])
  }
  return newObj
}

const CV_TYPE_LABELS: Record<string, string> = {
  exhibition: 'EXPOSICIÓN',
  collective: 'COLECTIVA',
  award: 'PREMIO',
  residency: 'RESIDENCIA',
  other: 'OTRO',
}

export default function ArtistaPage({ artist }: ArtistaProps) {
  if (!artist) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <p className={styles.empty}>Perfil del artista no disponible en este momento.</p>
        </div>
      </main>
    )
  }

  return (
    <>
      <Head>
        <title>Artista — {artist.name || 'Sin nombre'} — Janus</title>
        <meta name="description" content={artist.artist_statement?.slice(0, 160) || ''} />
      </Head>

      <main className={styles.page}>
        <div className={styles.splitLayout}>

          {/* ─── LEFT: eyebrow + nombre + foto ─── */}
          <div className={styles.photoCol}>
            {/* Nombre arriba */}
            <div className={styles.nameBlock}>
              <p className={styles.artistEyebrow}>Artista</p>
              <p className={styles.firstName}>Israel</p>
              <p className={styles.lastName}>Cortés</p>
              <p className={styles.artistLabel}>JANUS</p>
            </div>

            {/* Foto abajo */}
            <div className={styles.photoWrap}>
              {artist.photo_url ? (
                <img
                  src={artist.photo_url}
                  alt={artist.name}
                  className={styles.photo}
                  loading="lazy"
                />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                    <circle cx="24" cy="18" r="8" stroke="#3a3a3a" strokeWidth="1.5" />
                    <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#3a3a3a" strokeWidth="1.5" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT: bio + quote + CV ─── */}
          <div className={styles.bioCol}>
            <div
              className={styles.bioText}
              dangerouslySetInnerHTML={{ __html: artist.biography_html || artist.biography || '' }}
            />

            {artist.artist_statement && (
              <blockquote className={styles.quote}>
                "{artist.artist_statement}"
              </blockquote>
            )}

            {Array.isArray(artist.cv_items) && artist.cv_items.length > 0 && (
              <div className={styles.cv}>
                <p className={styles.cvLabel}>CURRICULUM</p>
                <ul className={styles.cvList}>
                  {artist.cv_items.map((item: any, i: number) => (
                    <li key={i} className={styles.cvItem}>
                      <span className={styles.cvYear}>{item.year || '—'}</span>
                      <div className={styles.cvMiddle}>
                        <p className={styles.cvDesc}>{item.description}</p>
                        {item.location && (
                          <p className={styles.cvLoc}>{item.location}</p>
                        )}
                      </div>
                      {item.category && item.category !== 'other' && (
                        <span className={styles.cvBadge}>
                          {CV_TYPE_LABELS[item.category] ?? item.category.toUpperCase()}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps<ArtistaProps> = async () => {
  try {
    const artist = await getArtist()
    if (!artist) return { props: { artist: null }, revalidate: 60 }

    const safeArtist = {
      ...artist,
      cv_items: Array.isArray(artist.cv_items)
        ? artist.cv_items.map((item: any) => ({
          ...item,
          year: item.year || 0,
          category: item.category || 'other',
          description: item.description || '',
          location: item.location || '',
        }))
        : [],
    }

    return { props: { artist: sanitizeForNextJs(safeArtist) }, revalidate: 3600 }
  } catch (error) {
    console.error('Error fetching artist from Odoo:', error)
    return { props: { artist: null }, revalidate: 10 }
  }
}
