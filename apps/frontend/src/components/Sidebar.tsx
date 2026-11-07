import { useId } from "react";
import { Calendar, ChartLine, Rectangles4 } from "@gravity-ui/icons";
import { Separator } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import { NavLink } from "@/components/NavLink";

import { AddDogButton } from "@/features/dogs/components/AddDogDialog";
import { SidebarArchiveLink } from "@/features/dogs/components/SidebarArchiveLink";
import { SidebarDogs } from "@/features/dogs/components/SidebarDogs";

export function Sidebar() {
  const { t } = useTranslation();
  const headingId = useId();

  return (
    // The aside stays put and draws the edge fades; the inner div scrolls
    // beneath them. Its -ml-1/pl-1 gives focus rings room without shifting
    // the sidebar off the page gutter.
    <aside className="w-full shrink-0 md:relative md:h-full md:w-sidebar md:before:pointer-events-none md:before:absolute md:before:top-0 md:before:right-0 md:before:-left-1 md:before:z-10 md:before:h-5 md:before:bg-linear-to-b md:before:from-background md:before:to-transparent md:after:pointer-events-none md:after:absolute md:after:right-0 md:after:bottom-0 md:after:-left-1 md:after:z-10 md:after:h-5 md:after:bg-linear-to-t md:after:from-background md:after:to-transparent">
      <div className="flex flex-col gap-6 md:-ml-1 md:h-full md:overflow-y-auto md:overscroll-contain md:py-5 md:pr-4 md:pl-1">
        <nav
          aria-label={t(($) => $.navigation.main)}
          className="flex flex-col gap-3"
        >
          <NavLink to={ROUTES.overview} icon={Rectangles4}>
            {t(($) => $.navigation.overview)}
          </NavLink>
          <NavLink to={ROUTES.calendar} icon={Calendar} tour="nav-calendar">
            {t(($) => $.navigation.calendar)}
          </NavLink>
          <NavLink to={ROUTES.disciplines} icon={ChartLine}>
            {t(($) => $.navigation.disciplines)}
          </NavLink>
        </nav>
        <section aria-labelledby={headingId} className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <h2
              id={headingId}
              className="shrink-0 text-xs font-medium text-muted"
            >
              {t(($) => $.navigation.myDogs)}
            </h2>
            <Separator className="flex-1" />
          </div>
          <div className="flex flex-col gap-4 md:gap-6">
            <SidebarDogs />
            <AddDogButton />
            <SidebarArchiveLink />
          </div>
        </section>
      </div>
    </aside>
  );
}
