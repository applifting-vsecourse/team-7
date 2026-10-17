import { type ReactNode } from "react";

import { HeaderLogo } from "@/components/Header/HeaderLogo";
import { HeaderNav } from "@/components/Header/HeaderNav";
import { ThemeSwitcher } from "@/components/Header/ThemeSwitcher";

type HeaderProps = {
  // Auth-aware menu (sign-in CTA / user dropdown). Passed as a slot so
  // `components/` doesn't have to import from `features/auth`.
  userMenu: ReactNode;
  showNavigation?: boolean;
  sidebarToggle?: ReactNode;
  compactLogo?: boolean;
};

export function Header({
  userMenu,
  showNavigation = true,
  sidebarToggle,
  compactLogo = false,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between self-stretch bg-background px-2 md:px-4">
      <div className="flex items-center gap-4">
        <HeaderLogo
          size={showNavigation ? "md" : "lg"}
          iconOnly={compactLogo}
        />
        {sidebarToggle}
        {showNavigation && <HeaderNav />}
      </div>
      <div
        className={
          compactLogo
            ? "flex items-center gap-4 rounded-3xl bg-surface py-1 pr-1 pl-3"
            : "flex items-center gap-2"
        }
      >
        <ThemeSwitcher />
        {userMenu}
      </div>
    </header>
  );
}
