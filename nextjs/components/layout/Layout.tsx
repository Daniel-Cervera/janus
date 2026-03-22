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
        { href: '/galeria', label: 'Galería' },
        { href: '/artista', label: 'Artista' },
        { href: '/exposiciones', label: 'Exposiciones' },
        { href: '/encargos', label: 'Encargos' },
    ]

    return (
        <>
            <header className={styles.header}>
                <nav className={styles.nav}>
                    <Link href="/" className={styles.logo}>
                        Casa <span className={styles.logoAccent}>Janus</span>
                    </Link>

                    <ul className={styles.navLinks}>
                        {navLinks.map(link => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`${styles.navLink} ${router.pathname.startsWith(link.href) ? styles.navLinkActive : ''
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <button
                        className={styles.cartBtn}
                        onClick={openCart}
                        aria-label={`Carrito (${cartCount} items)`}
                    >
                        <span className={styles.cartIcon}>◻</span>
                        {cartCount > 0 && (
                            <span className={styles.cartBadge}>{cartCount}</span>
                        )}
                    </button>
                </nav>
            </header>

            <main>{children}</main>

            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <p className={styles.footerLogo}>Casa Janus</p>
                    <div className={styles.footerLinks}>
                        <a href="https://www.instagram.com/janus_cp/"
                            target="_blank" rel="noopener noreferrer"
                            className={styles.footerLink}>
                            Instagram
                        </a>
                        <a href="https://www.facebook.com/janusvisualartist/"
                            target="_blank" rel="noopener noreferrer"
                            className={styles.footerLink}>
                            Facebook
                        </a>
                        <Link href="/encargos" className={styles.footerLink}>
                            Contacto
                        </Link>
                    </div>
                    <p className={styles.footerCopy}>
                        © {new Date().getFullYear()} Israel Cortés "Janus"
                    </p>
                </div>
            </footer>

            {/* CartDrawer global — visible en todas las páginas */}
            <CartDrawer />
        </>
    )
}