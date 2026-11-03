import { env } from "@/config/env";

/** Resolve a relative API path while preserving the configured path prefix. */
export function apiUrl(path: string): URL {
  // A path-only VITE_API_URL ("/api") resolves against the page's origin.
  const base = new URL(env.VITE_API_URL, window.location.origin);
  if (!base.pathname.endsWith("/")) base.pathname += "/";
  return new URL(path, base);
}
