import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['playwright-core', '@prisma/client'],
  // Enable standalone build for Docker
  output: 'standalone',
  // Set workspace root to avoid warning
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  // Disable static optimization for API routes
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};

export default nextConfig;
