/** @type {import('next').NextConfig} */

/**
 * next.config.js
 *
 * Task 1 — Routing dev → producción
 *
 * La landing page siempre responde en "/".
 * En Next.js Pages Router esto es automático: pages/index.tsx = ruta raíz.
 * Lo que sí necesitas configurar es:
 *  - output: 'standalone' para Docker
 *  - headers de seguridad
 *  - rewrites si el puerto cambia entre dev y prod
 */

const nextConfig = {
  reactStrictMode: true,

  // Necesario para el Dockerfile de producción (ya en el proyecto)
  output: 'standalone',

  // ── Imágenes externas ───────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname:  'imagedelivery.net',
        pathname:  '/**',
      },
      {
        // Picsum para development/testing
        protocol: 'https',
        hostname:  'picsum.photos',
        pathname:  '/**',
      },
    ],
  },

  // ── Headers de seguridad ─────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
        ],
      },
      {
        // Caché en Cloudflare para API routes
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store' }, // CRM: nunca cachear
        ],
      },
    ]
  },

  // ── Redirects ───────────────────────────────────────────────
  async redirects() {
    return [
      // Si algún link antiguo apunta a /statement, redirigir a /biography
      { source: '/statement', destination: '/biography', permanent: true },
    ]
  },
}

module.exports = nextConfig