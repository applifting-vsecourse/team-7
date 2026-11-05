import { createAuthClient } from "better-auth/react";

import { env } from "@/config/env";

export const authClient = createAuthClient({
  // A path-only VITE_BETTER_AUTH_URL ("/") resolves against the page's origin.
  baseURL: new URL(env.VITE_BETTER_AUTH_URL, window.location.origin).href,
});
