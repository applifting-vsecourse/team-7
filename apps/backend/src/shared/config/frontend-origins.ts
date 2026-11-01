import { type Config } from "./config.service";

export function frontendOrigins(config: Config): string[] {
  const additional = (config.additionalFrontendOrigins ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return [
    ...new Set(
      [config.frontendUrl, ...additional].map((value) => {
        const url = new URL(value);
        if (
          !["http:", "https:"].includes(url.protocol) ||
          url.hostname.includes("*") ||
          url.username ||
          url.password ||
          url.search ||
          url.hash ||
          url.pathname !== "/"
        ) {
          throw new Error(
            "Frontend origins must be exact HTTP(S) origins without paths, credentials, queries or fragments",
          );
        }
        return url.origin;
      }),
    ),
  ];
}
