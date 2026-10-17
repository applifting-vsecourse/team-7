import { Link } from "@tanstack/react-router";

import { ROUTES } from "@/app/routes";
import { Logo } from "@/components/Logo";

export function HeaderLogo({
  isLink = true,
  size = "md",
  iconOnly = false,
}: {
  isLink?: boolean;
  size?: "md" | "lg";
  iconOnly?: boolean;
}) {
  return isLink ? (
    <Link to={ROUTES.home} className="inline-flex">
      <Logo size={size} iconOnly={iconOnly} />
    </Link>
  ) : (
    <Logo size={size} iconOnly={iconOnly} />
  );
}
