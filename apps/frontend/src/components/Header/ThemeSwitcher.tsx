import { Moon, Sun } from "@gravity-ui/icons";
import { Switch } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/hooks/useTheme";

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <Switch
      isSelected={theme === "dark"}
      onChange={(isDark) => setTheme(isDark ? "dark" : "light")}
      className="inline-flex w-fit flex-row items-center rounded-3xl bg-background px-3 py-1 dark:bg-surface"
    >
      {({ isSelected }) => (
        <Switch.Content className="min-h-6 gap-4">
          <Switch.Control>
            <Switch.Thumb>
              <Switch.Icon>
                {isSelected ? (
                  <Moon className="size-3 text-inherit opacity-100" />
                ) : (
                  <Sun className="size-3 text-inherit opacity-70" />
                )}
              </Switch.Icon>
            </Switch.Thumb>
          </Switch.Control>
          {t(($) => $.theme[theme === "dark" ? "dark" : "light"])}
        </Switch.Content>
      )}
    </Switch>
  );
}
