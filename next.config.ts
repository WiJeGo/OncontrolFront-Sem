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

  // Gateway/proxy for backend, Orthanc and imaging-service.
  // Destinations are env-driven so the same code works in local dev
  // (localhost defaults) and in production (set these on Vercel to the
  // deployed/tunnelled HTTPS origins to avoid mixed-content and CORS).
  async rewrites() {
    const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://localhost:8081";
    const IMAGING_ORIGIN = process.env.IMAGING_ORIGIN ?? "http://localhost:8001";
    const ORTHANC_ORIGIN = process.env.ORTHANC_ORIGIN ?? "http://localhost:8042";

    return [
      // Spring Boot backend
      { source: "/api/:path*", destination: `${BACKEND_ORIGIN}/api/:path*` },

      // FastAPI imaging-service
      { source: "/imaging/:path*", destination: `${IMAGING_ORIGIN}/:path*` },

      // Orthanc web UI + plugins + REST used by viewers
      { source: "/orthanc/:path*", destination: `${ORTHANC_ORIGIN}/:path*` },
      { source: "/ohif/:path*", destination: `${ORTHANC_ORIGIN}/ohif/:path*` },
      { source: "/ui/:path*", destination: `${ORTHANC_ORIGIN}/ui/:path*` },
      { source: "/volview/:path*", destination: `${ORTHANC_ORIGIN}/volview/:path*` },
      { source: "/dicom-web/:path*", destination: `${ORTHANC_ORIGIN}/dicom-web/:path*` },
      { source: "/wado/:path*", destination: `${ORTHANC_ORIGIN}/wado/:path*` },
      { source: "/studies/:path*", destination: `${ORTHANC_ORIGIN}/studies/:path*` },
      { source: "/series/:path*", destination: `${ORTHANC_ORIGIN}/series/:path*` },
      { source: "/instances/:path*", destination: `${ORTHANC_ORIGIN}/instances/:path*` },
      { source: "/patients/:path*", destination: `${ORTHANC_ORIGIN}/patients/:path*` },
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
