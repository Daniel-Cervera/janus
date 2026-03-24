import { GetStaticProps } from 'next'
import Head from 'next/head'
import { getArtist } from '@/lib/odoo-client'
import type { Artist } from '@/lib/types'
import styles from './Artista.module.css'

interface ArtistaProps {
    artist: Artist | null
}

// 🔥 FUNCIÓN INFALIBLE: Limpia recursivamente todo el objeto de Odoo
// Convierte cualquier 'undefined' oculto en 'null' para que Next.js no explote.
function sanitizeForNextJs(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj ?? null;
    if (Array.isArray(obj)) return obj.map(sanitizeForNextJs);

    const newObj: any = {};
    for (const key in obj) {
        newObj[key] = obj[key] === undefined ? null : sanitizeForNextJs(obj[key]);
    }
    return newObj;
}

export default function ArtistaPage({ artist }: ArtistaProps) {
    // Manejo de estado nulo (Error de conexión o datos vacíos)
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
                <header className={styles.hero}>
                    <p className={styles.eyebrow}>Artista visual · México</p>
                    <h1 className={styles.name}>{artist.name}</h1>
                    {artist.artist_statement && (
                        <blockquote className={styles.statement}>
                            "{artist.artist_statement}"
                        </blockquote>
                    )}
                </header>

                <div className={styles.container}>
                    <div className={styles.grid}>
                        {/* Texto de la biografía renderizado de forma segura */}
                        <div className={styles.bioCol}>
                            <div
                                className={styles.bioText}
                                dangerouslySetInnerHTML={{ __html: artist.biography_html || artist.biography || '' }}
                            />
                        </div>

                        {/* Fotografía del artista */}
                        <div className={styles.photoCol}>
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
                                        <span>Fotografía no disponible</span>
                                    </div>
                                )}
                                <div className={styles.photoCaption}>
                                    <p className={styles.captionName}>{artist.name}</p>
                                    <p className={styles.captionSub}>Artista visual · Mexicano</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}

export const getStaticProps: GetStaticProps<ArtistaProps> = async () => {
    try {
        const artist = await getArtist()

        if (!artist) {
            return { props: { artist: null }, revalidate: 60 }
        }

        // 1. Mapeo seguro base (Forzamos valores por defecto como '0' en los años)
        const safeArtist = {
            ...artist,
            cv_items: Array.isArray(artist.cv_items)
                ? artist.cv_items.map((item: any) => ({
                    ...item,
                    year: item.year || 0,
                    category: item.category || 'other',
                    description: item.description || '',
                    location: item.location || ''
                }))
                : []
        }

        // 2. Pasamos el objeto por la limpieza profunda recursiva
        const cleanArtist = sanitizeForNextJs(safeArtist)

        return {
            props: { artist: cleanArtist },
            revalidate: 3600
        }
    } catch (error) {
        console.error("Error fetching artist from Odoo:", error)
        return {
            props: { artist: null },
            revalidate: 10
        }
    }
}