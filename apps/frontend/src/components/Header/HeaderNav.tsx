import { ROUTES } from "@/app/routes";
import { HeaderNavLink } from "@/components/Header/HeaderNavLink";

export function HeaderNav() {
  return (
    <nav className="flex items-center gap-1">
      <HeaderNavLink to={ROUTES.home}>Home</HeaderNavLink>
    </nav>
  );
}
