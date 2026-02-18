import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["child_process"],
  // Use webpack instead of turbopack for production builds
  // to avoid ENOENT issues with turbopack static files
};

export default nextConfig;
