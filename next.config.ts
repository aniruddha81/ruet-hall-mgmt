import type { NextConfig } from "next";

const backendApiUrl = process.env.BACKEND_API_URL ?? "http://ruet-backend";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;