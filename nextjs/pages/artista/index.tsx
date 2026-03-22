import { GetStaticProps } from 'next'
import Head from 'next/head'
import { getArtist } from '@/lib/odoo-client'
import type { Artist } from '@/lib/types'
import styles from './Artista.module.css'

interface ArtistaProps {
    artist: Artist | null
}

export default function ArtistaPage({ artist }: ArtistaProps) {
    if (!artist) {
        return (
            <main className={styles.page}>
                <div className={styles.container}>
                    <p className={styles.empty}>Perfil del artista no disponible.</p>
                </div>
            </main>
        )
    }

    return (
        <>
            <Head>
                <title>Artista — {artist.name} — Janus</title>
                <meta name="description" content={artist.artist_statement?.slice(0, 160)} />
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
                        {/* Texto de la biografía */}
                        <div className={styles.bio}>
                            <h2 className={styles.sectionLabel}>Biografía</h2>
                            {artist.biography ? (
                                <div
                                    className={styles.bioText}
                                    dangerouslySetInnerHTML={{ __html: artist.biography }}
                                />
                            ) : (
                                <p className={styles.bioText}>Biografía no disponible.</p>
                            )}

                            {/* CV / Hitos */}
                            {artist.cv_items && artist.cv_items.length > 0 && (
                                <div className={styles.cv}>
                                    <h2 className={styles.sectionLabel}>Trayectoria</h2>
                                    <ul className={styles.cvList}>
                                        {artist.cv_items.map((item, i) => (
                                            <li key={i} className={styles.cvItem}>
                                                <span className={styles.cvYear}>{item.year}</span>
                                                <div>
                                                    <p className={styles.cvDesc}>{item.description}</p>
                                                    {item.location && (
                                                        <p className={styles.cvLoc}>{item.location}</p>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Foto del artista */}
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
                                        <span>Fotografía del artista</span>
                                    </div>
                                )}
                                <div className={styles.photoCaption}>
                                    <p className={styles.captionName}>{artist.name}</p>
                                    <p className={styles.captionSub}>Artista visual · Mexicano · 1990</p>
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
        return { props: { artist }, revalidate: 3600 }
    } catch {
        return { props: { artist: null }, revalidate: 60 }
    }
}