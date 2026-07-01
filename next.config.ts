import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Turbopack configuration
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          ui: {
            test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
            name: 'ui',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },

    // Local gateway/proxy for backend, Orthanc and imaging-service
  async rewrites() {
    return [
      // Spring Boot backend
      {
        source: "/api/:path*",
        destination: "http://localhost:8081/api/:path*",
      },

      // FastAPI imaging-service
      {
        source: "/imaging/:path*",
        destination: "http://localhost:8001/:path*",
      },

      // Orthanc web UI
      {
        source: "/orthanc/:path*",
        destination: "http://localhost:8042/:path*",
      },

      // Orthanc OHIF plugin
      {
        source: "/ohif/:path*",
        destination: "http://localhost:8042/ohif/:path*",
      },

      // Orthanc UI nueva
      {
        source: "/ui/:path*",
        destination: "http://localhost:8042/ui/:path*",
      },

      // Orthanc VolView plugin
      {
        source: "/volview/:path*",
        destination: "http://localhost:8042/volview/:path*",
      },

      // Orthanc DICOMweb
      {
        source: "/dicom-web/:path*",
        destination: "http://localhost:8042/dicom-web/:path*",
      },

      // Orthanc WADO
      {
        source: "/wado/:path*",
        destination: "http://localhost:8042/wado/:path*",
      },

      // Some Orthanc REST routes used by plugins/viewers
      {
        source: "/studies/:path*",
        destination: "http://localhost:8042/studies/:path*",
      },
      {
        source: "/series/:path*",
        destination: "http://localhost:8042/series/:path*",
      },
      {
        source: "/instances/:path*",
        destination: "http://localhost:8042/instances/:path*",
      },
      {
        source: "/patients/:path*",
        destination: "http://localhost:8042/patients/:path*",
      },
    ];
  },

  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
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
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ];
  },
};

export default nextConfig;
