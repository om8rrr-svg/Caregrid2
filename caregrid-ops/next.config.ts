import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds for now to focus on core functionality
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
