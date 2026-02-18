import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["child_process"],
  allowedDevOrigins: ["https://preview.zkai.top", "http://preview.zkai.top"],
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
