import type { NextConfig } from "next";
import path from "node:path";

const appRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  turbopack: {
    root: appRoot,
  },
  async rewrites() {
    return [
      {
        source: '/socket.io/:path*',
        destination: 'http://localhost:5001/socket.io/:path*',
      },
    ];
  },
};

export default nextConfig;

