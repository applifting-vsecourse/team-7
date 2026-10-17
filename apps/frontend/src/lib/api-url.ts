import { env } from "@/config/env";

/** Resolve a relative API path while preserving the configured path prefix. */
export function apiUrl(path: string): URL {
  const base = new URL(env.VITE_API_URL);
  if (!base.pathname.endsWith("/")) base.pathname += "/";
  return new URL(path, base);
}
