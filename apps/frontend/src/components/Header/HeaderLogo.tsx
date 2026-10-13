import { Link } from "@tanstack/react-router";

import { ROUTES } from "@/app/routes";
import { Logo } from "@/components/Logo";

export function HeaderLogo({ isLink = true }: { isLink?: boolean }) {
  return isLink ? (
    <Link to={ROUTES.home} className="inline-flex">
      <Logo />
    </Link>
  ) : (
    <Logo />
  );
}
