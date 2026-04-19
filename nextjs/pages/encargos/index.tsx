import Head from 'next/head'
import CommissionForm from '@/components/commission/CommissionForm'
import styles from './Encargos.module.css'

const STEPS = [
  { num: '01', title: 'Consulta inicial',      text: 'Discutimos ideas y presupuesto.' },
  { num: '02', title: 'Propuesta conceptual',  text: 'Bocetos y materiales.' },
  { num: '03', title: 'Ejecución',             text: 'Documentado con actualizaciones.' },
  { num: '04', title: 'Entrega',               text: 'Con certificado de autenticidad.' },
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
        <div className={styles.splitLayout}>

          {/* ── LEFT — info ────────────────────────────────── */}
          <div className={styles.leftCol}>
            <p className={styles.eyebrow}>Encargos</p>
            <h1 className={styles.title}>Obra<br />personalizada</h1>

            <div className={styles.stepsGrid}>
              {STEPS.map(step => (
                <div key={step.num} className={styles.step}>
                  <span className={styles.stepNum}>{step.num}</span>
                  <div>
                    <p className={styles.stepTitle}>{step.title}</p>
                    <p className={styles.stepText}>{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT — formulario ─────────────────────────── */}
          <div className={styles.rightCol}>
            <CommissionForm />
          </div>

        </div>
      </main>
    </>
  )
}
