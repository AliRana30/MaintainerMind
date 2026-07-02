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

const postcssPluginPath = path.join(process.cwd(), "node_modules/@tailwindcss/postcss");
if (!fs.existsSync(postcssPluginPath)) {
  try {
    execSync("npm install @tailwindcss/postcss@4.0.0-beta.4 postcss@8.4.49 --no-audit --no-fund", {
      stdio: "inherit",
    });
  } catch (err) {
    console.error(err);
  }
}

const gsapPath = path.join(process.cwd(), "node_modules/gsap");
if (!fs.existsSync(gsapPath)) {
  try {
    execSync("npm install gsap --no-audit --no-fund", {
      stdio: "inherit",
    });
  } catch (err) {
    console.error(err);
  }
}



const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
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

