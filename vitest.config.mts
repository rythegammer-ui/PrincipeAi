import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(import.meta.dirname, "tests/unit/server-only-stub.ts"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    env: { PGLITE_DIR: "memory://", SEED_DEMO_DATA: "0" },
    testTimeout: 30_000,
    // The first DB query in each file boots and migrates the embedded PGlite, which can take a while under parallel load.
    hookTimeout: 60_000,
  },
});
