/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'imagedelivery.net', pathname: '/**' },
    ],
  },
}
module.exports = nextConfig
