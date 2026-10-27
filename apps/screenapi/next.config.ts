import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['playwright-core', '@prisma/client'],
  },
  // Enable standalone build for Docker
  output: 'standalone',
  // Disable static optimization for API routes
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};

export default nextConfig;
