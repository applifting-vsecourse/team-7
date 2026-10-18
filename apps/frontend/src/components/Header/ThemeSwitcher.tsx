import { Moon, Sun } from "@gravity-ui/icons";
import { Switch } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/hooks/useTheme";

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Switch
      isSelected={resolvedTheme === "dark"}
      onChange={(isDark) => setTheme(isDark ? "dark" : "light")}
      className="inline-flex w-fit flex-row items-center"
    >
      {({ isSelected }) => (
        <Switch.Content className="min-h-6 gap-2 leading-6 md:leading-5">
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
          {t(($) => $.theme[isSelected ? "dark" : "light"])}
        </Switch.Content>
      )}
    </Switch>
  );
}
