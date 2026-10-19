import { type ReactNode } from "react";

import { HeaderLogo } from "@/components/Header/HeaderLogo";
import { ThemeSwitcher } from "@/components/Header/ThemeSwitcher";
import { cn } from "@/lib/utils";

import { HeaderMenu } from "./HeaderMenu";

type HeaderProps = {
  // Auth-aware menu (sign-in CTA / user dropdown). Passed as a slot so
  // `components/` doesn't have to import from `features/auth`.
  sidebarToggle?: ReactNode;
  compactLogo?: boolean;
  showMenu?: boolean;
};

export function Header({
  sidebarToggle,
  compactLogo = false,
  showMenu = true,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-center bg-background">
      <div className="flex max-w-content grow items-center justify-between px-2 md:px-4">
        <div className="flex items-center gap-4">
          <HeaderLogo iconOnly={compactLogo} />
          {sidebarToggle}
        </div>
        <div
          className={cn(
            "flex shrink-0 items-center gap-4 rounded-3xl bg-surface py-1 pl-3",
            // The menu is a button or avatar, which sits closer to the edge.
            showMenu ? "pr-1" : "pr-3",
          )}
        >
          <ThemeSwitcher />
          {showMenu && <HeaderMenu />}
        </div>
      </div>
    </header>
  );
}
