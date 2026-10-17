import { defineProject } from "vitest/config";

export default defineProject({
  root: import.meta.dirname,
  resolve: { tsconfigPaths: true },
  oxc: {
    // Nest uses runtime type metadata for injection and DTO validation.
    decorator: { legacy: true, emitDecoratorMetadata: true },
    assumptions: { setPublicClassFields: true },
    typescript: { removeClassFieldsWithoutInitializer: true },
  },
  test: {
    name: "backend",
    environment: "node",
    include: ["src/**/*.spec.ts", "test/**/*.spec.ts"],
    setupFiles: ["reflect-metadata"],
  },
});
