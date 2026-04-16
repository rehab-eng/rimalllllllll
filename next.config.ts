import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.43.89"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
