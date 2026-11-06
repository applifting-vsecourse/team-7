import type { ComponentType, ReactNode, SVGProps } from "react";
import { Circle } from "@gravity-ui/icons";
import { buttonVariants } from "@heroui/react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { useSetAtom } from "jotai";

import { mobileSidebarOpenAtom } from "@/app/atoms/mobileSidebarOpenAtom";
import { transitionName } from "@/lib/utils";

// The active highlight slides to the newly active link across the route's
// view transition (only one link is active at a time).
const activeLink = { style: transitionName("nav-active") };

/** A main navigation link in the sidebar; closes the mobile menu on click. */
export function NavLink({
  to,
  icon: Icon,
  children,
}: {
  to: LinkProps["to"];
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  children: ReactNode;
}) {
  const setMobileSidebarOpen = useSetAtom(mobileSidebarOpenAtom);
  return (
    <Link
      to={to}
      onClick={() => setMobileSidebarOpen(false)}
      activeProps={activeLink}
      className={buttonVariants({
        variant: "ghost",
        className:
          "w-full h-9 justify-start gap-2 px-4 data-[status=active]:bg-accent data-[status=active]:text-accent-foreground",
      })}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">{children}</span>
      <Circle
        className="hidden size-4 shrink-0 in-data-[status=active]:block"
        aria-hidden="true"
      />
    </Link>
  );
}
