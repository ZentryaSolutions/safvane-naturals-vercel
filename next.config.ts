/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hide "Compiling..." / "Rendering..." badge in local dev (never shown in production)
  devIndicators: false,
  async redirects() {
    return [
      {
        source: "/order-confirmation/:orderNumber",
        destination: "/order-confirmation",
        permanent: false,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
