import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnvConfig(repoRoot);

const backendApiUrl = process.env.BACKEND_API_URL ?? "http://localhost:8000";

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
  reactCompiler: true,
};

export default nextConfig;
