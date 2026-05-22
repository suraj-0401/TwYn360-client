import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/metadata-builder",
        destination: "/factors/new",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${apiUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
