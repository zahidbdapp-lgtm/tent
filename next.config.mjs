/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['jspdf', 'fflate'],
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
