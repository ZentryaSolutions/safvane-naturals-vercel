/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hide "Compiling..." / "Rendering..." badge in local dev (never shown in production)
  devIndicators: false,
  serverActions: {
    bodySizeLimit: "20mb",
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
