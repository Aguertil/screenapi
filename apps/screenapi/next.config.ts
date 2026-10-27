import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['playwright-core'],
  },
  // Disable static optimization for API routes
  output: 'standalone',
};

export default nextConfig;
