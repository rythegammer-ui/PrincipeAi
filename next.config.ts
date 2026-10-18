import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows several isolated dev servers in one checkout (e.g. NEXT_DIST_DIR=.next-a npm run dev -- -p 3001).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // PGlite ships WASM + data files that must be loaded with native require at runtime.
  serverExternalPackages: ["@electric-sql/pglite"],
  // SQL migrations are read from disk at runtime (PGlite demo/dev mode), so make sure
  // they are traced into every serverless function bundle.
  outputFileTracingIncludes: {
    "/**": ["./drizzle/**/*"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
