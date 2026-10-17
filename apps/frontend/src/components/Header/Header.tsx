import { type ReactNode } from "react";

import { HeaderLogo } from "@/components/Header/HeaderLogo";
import { HeaderNav } from "@/components/Header/HeaderNav";
import { ThemeSwitcher } from "@/components/Header/ThemeSwitcher";

import { HeaderMenu } from "./HeaderMenu";

type HeaderProps = {
  // Auth-aware menu (sign-in CTA / user dropdown). Passed as a slot so
  // `components/` doesn't have to import from `features/auth`.
  showNavigation?: boolean;
  sidebarToggle?: ReactNode;
  compactLogo?: boolean;
};

export function Header({
  showNavigation = true,
  sidebarToggle,
  compactLogo = false,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between self-stretch bg-background px-2 md:px-4">
      <div className="flex items-center gap-4">
        <HeaderLogo iconOnly={compactLogo} />
        {sidebarToggle}
        {showNavigation && !compactLogo && <HeaderNav />}
      </div>
      <div
        className={
          "flex shrink-0 items-center gap-4 rounded-3xl px-3 py-1 dark:bg-surface"
        }
      >
        <ThemeSwitcher />
        <HeaderMenu />
      </div>
    </header>
  );
}
