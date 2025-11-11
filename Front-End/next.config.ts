import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.unsplash.com",
      },
      // Supabase Storage pour les avatars et autres images
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "supabase.co",
      },
      // Mapbox pour les tuiles de carte
      {
        protocol: "https",
        hostname: "api.mapbox.com",
      },
      {
        protocol: "https",
        hostname: "**.mapbox.com",
      },
      // Ajouter d'autres domaines d'images si nécessaire (Freepik, etc.)
    ],
  },
  // Headers pour Mapbox
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.mapbox.com; style-src 'self' 'unsafe-inline' https://api.mapbox.com; img-src 'self' data: https: blob:; font-src 'self' data:; worker-src blob: 'self'; connect-src 'self' http://localhost:5000 https://api.mapbox.com https://events.mapbox.com https://*.mapbox.com wss://*.supabase.co;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
