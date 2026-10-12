export default {
  "*.{js,jsx,cjs,mjs,ts,tsx}": (files) => {
    const otherFiles = files.filter(
      (file) =>
        !file.includes("/apps/frontend/src/") &&
        !file.includes("/apps/backend/src/"),
    );
    return otherFiles.length
      ? `oxfmt --write ${otherFiles.map((file) => JSON.stringify(file)).join(" ")}`
      : [];
  },
  "apps/frontend/src/**/*.{ts,tsx,js,cjs,mjs}": [
    "pnpm --filter frontend exec oxlint --fix",
    "oxfmt --write",
  ],
  "apps/backend/src/**/*.{ts,tsx}": [
    "pnpm --filter backend exec oxlint --fix",
    "oxfmt --write",
  ],
  "*.{json,jsonc,css,html,svg,md,yaml,yml}":
    "oxfmt --write --no-error-on-unmatched-pattern",
};
