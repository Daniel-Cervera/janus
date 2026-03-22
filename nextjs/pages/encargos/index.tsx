import Head from 'next/head'
import Link from 'next/link'
import CommissionForm from '@/components/commission/CommissionForm'
import styles from './Encargos.module.css'

export default function EncargosPage() {
    return (
        <>
            <Head>
                <title>Encargos personalizados — Janus</title>
                <meta
                    name="description"
                    content="Solicita una obra personalizada al artista Janus. Encargos únicos para coleccionistas y espacios."
                />
            </Head>

            <main className={styles.page}>
                <div className={styles.hero}>
                    <p className={styles.eyebrow}>Obra personalizada</p>
                    <h1 className={styles.title}>Encargos</h1>
                    <p className={styles.subtitle}>
                        Cada encargo es una conversación. Cuéntame tu visión y encontramos
                        juntos la forma de materializarla.
                    </p>
                </div>

                <div className={styles.container}>
                    <div className={styles.grid}>
                        <div className={styles.info}>
                            <h2 className={styles.infoTitle}>¿Cómo funciona?</h2>
                            <ol className={styles.steps}>
                                <li className={styles.step}>
                                    <span className={styles.stepNum}>01</span>
                                    <div>
                                        <p className={styles.stepTitle}>Cuéntame tu idea</p>
                                        <p className={styles.stepText}>
                                            Comparte el espacio, las dimensiones, la técnica preferida
                                            y cualquier referencia visual que tengas.
                                        </p>
                                    </div>
                                </li>
                                <li className={styles.step}>
                                    <span className={styles.stepNum}>02</span>
                                    <div>
                                        <p className={styles.stepTitle}>Propuesta y presupuesto</p>
                                        <p className={styles.stepText}>
                                            En 48 horas te envío una propuesta con boceto inicial
                                            y presupuesto detallado.
                                        </p>
                                    </div>
                                </li>
                                <li className={styles.step}>
                                    <span className={styles.stepNum}>03</span>
                                    <div>
                                        <p className={styles.stepTitle}>Creación y entrega</p>
                                        <p className={styles.stepText}>
                                            Con tu aprobación inicio la obra. Recibirás actualizaciones
                                            del proceso y la obra llega a tu puerta.
                                        </p>
                                    </div>
                                </li>
                            </ol>
                        </div>

                        <CommissionForm />
                    </div>
                </div>
            </main>
        </>
    )
}