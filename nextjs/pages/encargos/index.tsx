import Head from 'next/head'
import CommissionForm from '@/components/commission/CommissionForm'
import styles from './Encargos.module.css'

const STEPS = [
  {
    num: '01',
    title: 'Consulta inicial',
    text: 'Comparte tu idea, el espacio, dimensiones y cualquier referencia visual que tengas en mente.',
  },
  {
    num: '02',
    title: 'Propuesta conceptual',
    text: 'En 48 horas recibirás una propuesta con boceto inicial y presupuesto detallado.',
  },
  {
    num: '03',
    title: 'Ejecución',
    text: 'Con tu aprobación y anticipo, inicio la obra. Recibirás actualizaciones del proceso.',
  },
  {
    num: '04',
    title: 'Entrega',
    text: 'La obra llega a tu puerta lista para colgar, con certificado de autenticidad.',
  },
]

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

          {/* ── Proceso 2×2 ──────────────────────────────── */}
          <div className={styles.processSection}>
            <h2 className={styles.processTitle}>¿CÓMO FUNCIONA?</h2>
            <div className={styles.stepsGrid}>
              {STEPS.map(step => (
                <div key={step.num} className={styles.step}>
                  <span className={styles.stepNum}>{step.num}</span>
                  <p className={styles.stepTitle}>{step.title}</p>
                  <p className={styles.stepText}>{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Formulario ───────────────────────────────── */}
          <div className={styles.formSection}>
            <h2 className={styles.formTitle}>ENVIAR SOLICITUD</h2>
            <CommissionForm />
          </div>

        </div>
      </main>
    </>
  )
}
