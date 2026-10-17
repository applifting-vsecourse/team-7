import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "apps/backend/vitest.config.mts",
      "apps/frontend/vitest.config.ts",
    ],
    coverage: {
      include: ["apps/*/src/**/*.{ts,tsx}"],
      exclude: [
        ...coverageConfigDefaults.exclude,
        "**/generated/**",
        "**/interfaces/**",
        "**/*.module.ts",
        "**/*.mock.ts",
        "**/*.type.ts",
        "**/*.dto.ts",
        "apps/backend/src/main.ts",
        "apps/frontend/src/routeTree.gen.ts",
      ],
      reporter: ["html", "text", "text-summary", "cobertura"],
    },
  },
});
