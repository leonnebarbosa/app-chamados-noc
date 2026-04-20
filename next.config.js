/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilita output standalone para Docker
  output: "standalone",
  
  // Configurações de imagem (se usar next/image com domínios externos)
  images: {
    unoptimized: true,
  },
  
  // Variáveis de ambiente públicas (acessíveis no cliente)
  env: {
    APP_NAME: process.env.APP_NAME || "NOC Chamados",
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ]
  },
}

module.exports = nextConfig
