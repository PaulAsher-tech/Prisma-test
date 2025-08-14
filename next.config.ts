import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'prisma'],
  experimental: {
    outputFileTracingRoot: undefined,
  }
};

export default nextConfig;
