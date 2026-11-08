/**
 * Email-safe sRGB equivalents of the light semantic tokens supplied by
 * @heroui/styles through frontend/styles/global.css. Mail clients cannot
 * reliably resolve CSS variables or OKLCH, so templates use this snapshot.
 * Keep these in sync when the app's theme changes.
 */
export const emailTheme = {
  background: "#f5f5f5",
  foreground: "#18181b",
  surface: "#ffffff",
  muted: "#71717a",
  accent: "#0485f7",
  accentForeground: "#fcfcfc",
  border: "#dedee0",
  radius: 12,
  fontSans: "Inter, Arial, Helvetica, sans-serif",
  fontLogo: '"Lily Script One", Georgia, serif',
} as const;
