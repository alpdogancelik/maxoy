const path = require("path");
/** @type {import('next').NextConfig} */
const mediaHost = process.env.NEXT_PUBLIC_MEDIA_HOST || "localhost";

const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  experimental: {
    largePageDataBytes: 256 * 1000,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: mediaHost,
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  compiler: {
    styledComponents: true,
  },
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),
    };
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

module.exports = nextConfig;
