import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCartStore } from '@/store/cartStore'
import CartDrawer from '@/components/cart/CartDrawer'
import styles from './Layout.module.css'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const cartCount = useCartStore(s => s.totalItems())
  const openCart = useCartStore(s => s.openCart)

  const navLinks = [
    { href: '/galeria',      label: 'Galería'      },
    { href: '/artista',      label: 'Artista'      },
    { href: '/exposiciones', label: 'Exposiciones' },
    { href: '/encargos',     label: 'Encargos'     },
  ]

  const isActive = (href: string) =>
    href === '/'
      ? router.pathname === '/'
      : router.pathname.startsWith(href)

  return (
    <>
      {/* ── Navbar ────────────────────────────────────────── */}
      <header className={styles.header}>
        <nav className={styles.nav}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            CASA <span className={styles.logoAccent}>JANUS</span>
          </Link>

          {/* Links */}
          <ul className={styles.navLinks}>
            {navLinks.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${styles.navLink} ${isActive(link.href) ? styles.navLinkActive : ''}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Cart */}
          <button
            className={styles.cartBtn}
            onClick={openCart}
            aria-label={`Carrito (${cartCount} items)`}
          >
            <CartIcon />
            {cartCount > 0 && (
              <span className={styles.cartBadge}>{cartCount}</span>
            )}
          </button>
        </nav>
      </header>

      {/* ── Contenido de página ───────────────────────────── */}
      {children}

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerLogo}>
            CASA <span className={styles.footerLogoAccent}>JANUS</span>
          </p>
          <div className={styles.footerLinks}>
            <a
              href="https://www.instagram.com/janus_cp/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              Instagram
            </a>
            <a
              href="https://www.facebook.com/janusvisualartist/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              Facebook
            </a>
            <Link href="/encargos" className={styles.footerLink}>
              Contacto
            </Link>
          </div>
          <p className={styles.footerCopy}>
            © {new Date().getFullYear()} Israel Cortés &quot;Janus&quot;
          </p>
        </div>
      </footer>

      {/* CartDrawer global */}
      <CartDrawer />
    </>
  )
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="16" height="16" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
