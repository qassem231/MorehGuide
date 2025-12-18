import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable source maps completely
  productionBrowserSourceMaps: false,
  devIndicators: {
    buildActivity: false,
  },
  // Configure Turbopack for Next.js 16
  turbopack: {},
};

export default nextConfig;
