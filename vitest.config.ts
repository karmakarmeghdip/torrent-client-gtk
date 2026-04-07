import { defineConfig } from "vitest/config";

export const vitestConfig = defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["references/**", "node_modules/**"],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["references/**", "node_modules/**"],
    },
  },
});
