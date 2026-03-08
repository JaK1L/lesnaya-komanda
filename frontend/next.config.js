/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don't run ESLint during production builds (run it separately in CI/CD)
    ignoreDuringBuilds: true,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/**',
      },
    ],
  },
  
  // Оптимизация bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Vendor splitting для оптимизации кэширования
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // React и React-DOM в отдельный chunk
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react-vendor',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Framer Motion в отдельный chunk
            framerMotion: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'framer-motion-vendor',
              priority: 15,
              reuseExistingChunk: true,
            },
            // Axios в отдельный chunk
            axios: {
              test: /[\\/]node_modules[\\/]axios[\\/]/,
              name: 'axios-vendor',
              priority: 15,
              reuseExistingChunk: true,
            },
            // Lucide icons в отдельный chunk
            lucide: {
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              name: 'lucide-vendor',
              priority: 15,
              reuseExistingChunk: true,
            },
            // Остальные node_modules
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            // Общий код между страницами
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }
    
    return config
  },
  
  // Experimental features для оптимизации
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
}

module.exports = nextConfig
