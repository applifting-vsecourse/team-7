import { z } from "zod";

// An absolute URL, or a path on this origin ("/api") served by the Vite dev
// proxy, which makes the app work from localhost and the LAN alike.
const urlOrPath = z.union([z.string().url(), z.string().startsWith("/")]);

const envSchema = z.object({
  VITE_API_URL: urlOrPath,
  VITE_BETTER_AUTH_URL: urlOrPath,
});

type EnvSchema = z.infer<typeof envSchema>;

export const env = ((): EnvSchema => {
  const parsed = envSchema.safeParse(import.meta.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    const fieldErrors = parsed.error.flatten().fieldErrors;
    Object.entries(fieldErrors).forEach(([field, errors]) => {
      errors?.forEach((error) => {
        console.error(`  ${field}: ${error}`);
      });
    });
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
})();

declare global {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- Vite environment types require declaration merging.
  interface ImportMetaEnv extends EnvSchema {}
}
