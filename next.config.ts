import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
  allowedDevOrigins: ["*.ngrok-free.app"],
};

export default withNextIntl(nextConfig);
