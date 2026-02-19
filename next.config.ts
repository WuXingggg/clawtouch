import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["child_process"],
  allowedDevOrigins: ["preview.zkai.top", "*.zkai.top"],
  turbopack: {
    root: resolve(__dirname),
  },
  async redirects() {
    return [
      {
        source: "/:path(chat|cron|tokens|skills|models)",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
