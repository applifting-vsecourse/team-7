import { Link } from "@tanstack/react-router";

import { ROUTES } from "@/app/routes";
import { Logo } from "@/components/Logo";

export function HeaderLogo({
  isLink = true,
  size = "md",
}: {
  isLink?: boolean;
  size?: "md" | "lg";
}) {
  return isLink ? (
    <Link to={ROUTES.home} className="inline-flex">
      <Logo size={size} />
    </Link>
  ) : (
    <Logo size={size} />
  );
}
