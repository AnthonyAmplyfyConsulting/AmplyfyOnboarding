import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['docusign-esign'],
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
