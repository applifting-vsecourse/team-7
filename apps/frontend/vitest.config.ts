import react from "@vitejs/plugin-react";
import { configDefaults, defineProject } from "vitest/config";

export default defineProject({
  root: import.meta.dirname,
  plugins: [react()],
  // Vite 8 resolves tsconfig `paths` (the `@/` alias) natively.
  resolve: { tsconfigPaths: true },
  test: {
    name: "frontend",
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
