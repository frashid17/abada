import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
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
  poweredByHeader: false,
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
  ],
};

const withIntl = withNextIntl(nextConfig);

/**
 * Skip the Sentry build wrapper in local `next dev`.
 * withSentryConfig adds clientTraceMetadata + instrumentation compile cost;
 * Turbopack already skips most webpack Sentry plugins, but wrapping still slows first paint.
 * Opt in locally with SENTRY_DEV=true. Always wrapped for production builds / CI.
 */
const enableSentryBuild =
  process.env.NODE_ENV === "production" ||
  process.env.CI === "true" ||
  process.env.SENTRY_DEV === "true";

export default enableSentryBuild
  ? withSentryConfig(withIntl, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      // Webpack-only; ignored under Turbopack (dev default).
      webpack: {
        treeshake: {
          removeDebugLogging: true,
        },
      },
      // Source map upload is optional — only runs when SENTRY_AUTH_TOKEN is set.
      sourcemaps: {
        disable: !process.env.SENTRY_AUTH_TOKEN,
      },
    })
  : withIntl;
