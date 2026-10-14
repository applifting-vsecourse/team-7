import { type ReactNode } from "react"

import { HeaderLogo } from "@/components/Header/HeaderLogo"
import { HeaderNav } from "@/components/Header/HeaderNav"
import { ThemeSwitcher } from "@/components/Header/ThemeSwitcher"

type HeaderProps = {
  // Auth-aware menu (sign-in CTA / user dropdown). Passed as a slot so
  // `components/` doesn't have to import from `features/auth`.
  userMenu: ReactNode
}

export function Header({ userMenu }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between self-stretch px-2 md:p-4">
      <div className="flex items-center gap-4">
        <HeaderLogo />
        <HeaderNav />
      </div>
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        {userMenu}
      </div>
    </header>
  )
}
