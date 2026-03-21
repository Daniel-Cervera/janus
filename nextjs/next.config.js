/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ── Imágenes ───────────────────────────────────────────────────────────
  // No usamos next/image para las obras (Cloudflare Images hace el resize)
  // pero sí para imágenes del artista/sistema que no pasen por CF Images.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
        // Permite cualquier Account Hash de Cloudflare Images
        pathname: '/**',
      },
    ],
    // Deshabilitar optimización de Next.js para imágenes de obras
    // (Cloudflare Images ya las optimiza en el edge)
    unoptimized: false,
  },

  // ── Headers de seguridad y caché ──────────────────────────────────────
  async headers() {
    return [
      {
        // Aplica a todas las rutas
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // Caché agresiva para assets estáticos de Next.js
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Rutas de API: sin caché en el browser, caché en Cloudflare
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=3600',
          },
        ],
      },
    ]
  },

  // ── Redirects ─────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Redirigir /gallery y /obras a /galeria
      { source: '/gallery', destination: '/galeria', permanent: true },
      { source: '/obras',   destination: '/galeria', permanent: true },
    ]
  },

  // ── Webpack config ────────────────────────────────────────────────────
  // Necesario si se usan SVGs como componentes
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })
    return config
  },
}

module.exports = nextConfig