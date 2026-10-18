import { type ReactNode, useEffect } from "react";
import { useTheme as useHeroUITheme } from "@heroui/react";
import { useAtom, useAtomValueRawSync, useSetAtom, useStore } from "jotai";

import { resolvedThemeAtom, themeAtom } from "@/app/atoms/themeAtom";

export function ThemeController({ children }: { children: ReactNode }) {
  const store = useStore();
  const preference = useAtomValueRawSync(themeAtom);
  const { theme, resolvedTheme, setTheme } = useHeroUITheme(preference);
  const setResolvedTheme = useSetAtom(resolvedThemeAtom);

  // Keep one native HeroUI controller responsible for the DOM and OS changes.
  useEffect(() => {
    // The storage subscription may refresh the atom during this commit.
    const currentPreference = store.get(themeAtom);
    if (theme !== currentPreference) {
      setTheme(currentPreference);
    } else {
      setResolvedTheme(resolvedTheme);
    }
  }, [preference, theme, resolvedTheme, setTheme, setResolvedTheme, store]);

  return children;
}

export function useTheme() {
  const [theme, setTheme] = useAtom(themeAtom);
  const resolvedTheme = useAtomValueRawSync(resolvedThemeAtom);
  return { theme, resolvedTheme, setTheme };
}
