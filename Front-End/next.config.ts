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
      // Ajouter d'autres domaines d'images si nécessaire (Freepik, etc.)
    ],
  },
};

export default nextConfig;
