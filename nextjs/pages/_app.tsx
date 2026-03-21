import type { AppProps } from 'next/app'
import '@/styles/globals.css'
import CartDrawer from '@/components/cart/CartDrawer'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <CartDrawer />
    </>
  )
}