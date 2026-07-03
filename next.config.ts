import type { NextConfig } from "next";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const conflictingFile = path.join(process.cwd(), "src/app/(dashboard)/page.tsx");
if (fs.existsSync(conflictingFile)) {
  try {
    fs.unlinkSync(conflictingFile);
  } catch (err) {
    console.error(err);
  }
}


const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@prisma/client$": path.resolve(process.cwd(), "node_modules/@prisma/client/index.js"),
        ".prisma/client$": path.resolve(process.cwd(), "node_modules/.prisma/client/index.js"),
      };
    }
    return config;
  },
};

export default nextConfig;

