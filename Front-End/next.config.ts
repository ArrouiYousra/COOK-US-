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
  // Headers pour Mapbox et backend
  async headers() {
    // Récupérer l'URL du backend depuis les variables d'environnement
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    // Extraire le hostname (sans /api)
    const backendHost = backendUrl.replace(/^https?:\/\//, "").split("/")[0];
    
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.mapbox.com https://js.stripe.com https://*.stripe.com; style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https: blob:; worker-src blob: 'self'; frame-src 'self' https://js.stripe.com https://*.stripe.com; connect-src 'self' http://localhost:5000 https://${backendHost} https://*.onrender.com https://api.mapbox.com https://events.mapbox.com https://*.mapbox.com https://api.stripe.com https://*.stripe.com wss://*.supabase.co https://*.supabase.co;`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
