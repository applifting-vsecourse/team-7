import { Moon, Sun } from "@gravity-ui/icons";
import { Switch } from "@heroui/react";

import { useTheme } from "@/hooks/useTheme";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <Switch
      isSelected={theme === "dark"}
      onChange={(isDark) => setTheme(isDark ? "dark" : "light")}
      className="inline-flex w-fit flex-row items-center rounded-3xl bg-surface px-3 py-1"
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
          {theme === "dark" ? "Dark" : "Light"}
        </Switch.Content>
      )}
    </Switch>
  );
}
