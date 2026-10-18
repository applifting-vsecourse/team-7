import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type Theme = "light" | "dark" | "system";

function parseTheme(value: string | null, fallback: Theme): Theme {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : fallback;
}

// HeroUI stores plain strings rather than the JSON used by Jotai's default storage.
export const themeAtom = atomWithStorage<Theme>(
  "heroui-theme",
  "system",
  {
    getItem(key, initialValue) {
      const saved = localStorage.getItem(key);
      if (saved !== null) return parseTheme(saved, initialValue);

      const legacy = localStorage.getItem("theme");
      const theme = parseTheme(legacy, initialValue);
      if (legacy) localStorage.setItem(key, theme);
      return theme;
    },
    setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: (key) => localStorage.removeItem(key),
    subscribe(key, callback, initialValue) {
      const onStorage = (event: StorageEvent) => {
        if (
          event.storageArea === localStorage &&
          (event.key === key || event.key === null)
        ) {
          callback(parseTheme(event.newValue, initialValue));
        }
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
  },
  { getOnInit: true },
);

export const resolvedThemeAtom = atom<string | undefined>(undefined);
