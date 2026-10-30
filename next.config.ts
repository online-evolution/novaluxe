import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
  cacheComponents: true,
  images: {
    // 90 voor grote foto's, zoals de salon in de opening.
    qualities: [75, 90],
    // Foto's uit het beheer staan in Vercel Blob (src/server/storage).
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com", port: "", pathname: "/fotos/**", search: "" },
    ],
  },
  experimental: {
    serverActions: {
      // Foto-uploads in het beheer: de browser verkleint eerst; een voor-en-na-paar
      // is samen ruim onder deze grens. Vercel staat maximaal 4,5 MB per verzoek toe.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
