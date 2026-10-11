/// <reference types="vitest" />
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { checker } from "vite-plugin-checker"
import svgr from "vite-plugin-svgr"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_")

  return {
    plugins: [
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react({ compiler: true }),
      tailwindcss(),
      svgr(),
      checker({
        typescript: true,
        oxlint: { lintCommand: "oxlint src", watchPath: "./src" },
        overlay: { initialIsOpen: false },
      }),
    ],
    // Vite 8 resolves tsconfig `paths` (the `@/` alias) natively.
    resolve: { tsconfigPaths: true },
    server: {
      port: 3050,
      // Fail loudly instead of silently moving to 3001, which the backend's
      // CORS allow-list would then reject with an opaque browser error.
      strictPort: true,
      allowedHosts: env.VITE_ALLOWED_HOSTS ? env.VITE_ALLOWED_HOSTS.split(",") : [],
    },
    build: { outDir: "build" },
  }
})
