import { Link } from "@tanstack/react-router";

import { ROUTES } from "@/app/routes";
import { Logo } from "@/components/Logo";

export function HeaderLogo({
  isLink = true,
  iconOnly = false,
}: {
  isLink?: boolean;
  iconOnly?: boolean;
}) {
  return isLink ? (
    <Link to={ROUTES.home} className="inline-flex">
      <Logo size="lg" iconOnly={iconOnly} />
    </Link>
  ) : (
    <Logo size="lg" iconOnly={iconOnly} />
  );
}
