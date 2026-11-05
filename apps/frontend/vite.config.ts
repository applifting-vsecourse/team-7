import babel from "@rolldown/plugin-babel";
/// <reference types="vitest" />
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { checker } from "vite-plugin-checker";
import svgr from "vite-plugin-svgr";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react({
        compiler: true,
      }),
      babel({
        presets: ["jotai-babel/preset"],
      }),
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
      // Listen on the LAN too, so phones on the same network can open
      // http://<this-pc-ip>:3050.
      host: true,
      // Dev proxy: with VITE_API_URL=/api the browser talks only to this
      // server, which forwards /api to the backend. One origin means the auth
      // cookie works the same on localhost and on the LAN IP, without CORS.
      proxy: {
        "/api": {
          target: env.VITE_DEV_API_TARGET || "http://localhost:4050",
          changeOrigin: true,
          configure: (proxy) => {
            // BetterAuth rejects origins it doesn't trust; the LAN address
            // changes with DHCP, so present every proxied request as the
            // trusted dev origin. Dev server only.
            proxy.on("proxyReq", (proxyReq) => {
              if (proxyReq.getHeader("origin")) {
                proxyReq.setHeader("origin", "http://localhost:3050");
              }
            });
          },
        },
      },
      port: 3050,
      // Fail loudly instead of silently moving to 3001, which the backend's
      // CORS allow-list would then reject with an opaque browser error.
      strictPort: true,
      allowedHosts: env.VITE_ALLOWED_HOSTS
        ? env.VITE_ALLOWED_HOSTS.split(",")
        : [],
    },
    build: { outDir: "build" },
  };
});
