/**
 * pages/tienda/confirmacion.tsx
 *
 * Página de confirmación post-checkout.
 * Muestra el número de orden recibido como query param ?order=CJ-0042
 */

import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from './Confirmacion.module.css'

const ConfirmacionPage: NextPage = () => {
  const router = useRouter()
  const orderName = router.query.order as string | undefined

  return (
    <>
      <Head>
        <title>Pedido confirmado — Casa Janus</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.icon} aria-hidden="true">✓</div>

          <p className={styles.label}>Casa Janus</p>
          <h1 className={styles.title}>Pedido recibido</h1>

          {orderName && (
            <p className={styles.orderRef}>Referencia: <strong>{orderName}</strong></p>
          )}

          <p className={styles.message}>
            Hemos recibido tu solicitud. En breve recibirás un correo de confirmación.
            El artista se pondrá en contacto contigo para coordinar los detalles de envío.
          </p>

          <div className={styles.ctas}>
            <Link href="/galeria" className={styles.btnPrimary}>
              Volver a la galería
            </Link>
            <Link href="/" className={styles.btnSecondary}>
              Ir al inicio
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default ConfirmacionPage
