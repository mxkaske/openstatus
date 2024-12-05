const { withContentCollections } = require("@content-collections/next");
const { withSentryConfig } = require("@sentry/nextjs");

// REMINDER: avoid Clickjacking attacks by setting the X-Frame-Options header
const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ["@openstatus/ui", "@openstatus/api"],
  experimental: {
    outputFileTracingIncludes: {
      "/": [
        "./node_modules/.pnpm/@google-cloud/tasks/build/esm/src/**/*.json",
        "./node_modules/@google-cloud/tasks/build/esm/src/**/*.js",
      ],
    },
    serverComponentsExternalPackages: [
      // "libsql",
      // "@libsql",
      "@react-email/components",
      "@react-email/render",
      "@google-cloud/tasks",
      // "@libsql/client",
      // "@libsql/hrana-client",
      // "better-sqlite3"
    ],
    optimizePackageImports: ["@tremor/react"],
    /**
     * The default stale revalidate time for SWR requests is 1year.
     * We can't rely on the default because the status pages will always return the
     * STALE data before revalidate.
     * @link https://nextjs.org/docs/app/api-reference/next-config-js/swrDelta
     */
    swrDelta: 120,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "screenshot.openstat.us",
      },
      {
        protocol: "https",
        hostname: "www.openstatus.dev",
      },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async rewrites() {
    return {
      afterFiles: [
        {
          source: "/:path*",
          has: [
            {
              type: "host",
              value:
                process.env.NODE_ENV === "production"
                  ? "app.openstatus.dev"
                  : "app.localhost",
            },
          ],
          destination: "/app/:path*",
        },
        {
          source: "/app/api/:path*", // ensure the API paths are mapped correctly
          has: [
            {
              type: "host",
              value:
                process.env.NODE_ENV === "production"
                  ? "app.openstatus.dev"
                  : "app.localhost",
            },
          ],
          destination: "/api/:path*",
        },
      ],
    };
  },
};

module.exports = withSentryConfig(
  async () => await withContentCollections(nextConfig),
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,

    org: "openstatus",
    project: "openstatus",
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: false,

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
  },
);
