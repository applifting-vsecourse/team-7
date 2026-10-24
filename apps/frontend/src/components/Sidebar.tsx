import { useId } from "react";
import {
  Calendar,
  ChartLine,
  Circle,
  LayoutList,
  Rectangles4,
} from "@gravity-ui/icons";
import { Button, buttonVariants, Separator } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { mobileSidebarOpenAtom } from "@/app/atoms/mobileSidebarOpenAtom";
import { ROUTES } from "@/app/routes";

import { AddDogButton } from "@/features/dogs/components/AddDogDialog";
import { SidebarDogs } from "@/features/dogs/components/SidebarDogs";

export function Sidebar() {
  const { t } = useTranslation();
  const headingId = useId();
  const setMobileSidebarOpen = useSetAtom(mobileSidebarOpenAtom);

  return (
    // The aside stays put and draws the edge fades; the inner div scrolls
    // beneath them. Its -ml-1/pl-1 gives focus rings room without shifting
    // the sidebar off the page gutter.
    <aside className="w-full shrink-0 md:sticky md:top-16 md:h-[calc(100dvh-5rem)] md:w-sidebar md:self-start md:before:pointer-events-none md:before:absolute md:before:top-0 md:before:right-0 md:before:-left-1 md:before:z-10 md:before:h-5 md:before:bg-linear-to-b md:before:from-background md:before:to-transparent md:after:pointer-events-none md:after:absolute md:after:right-0 md:after:bottom-0 md:after:-left-1 md:after:z-10 md:after:h-5 md:after:bg-linear-to-t md:after:from-background md:after:to-transparent">
      <div className="flex flex-col gap-6 md:-ml-1 md:h-full md:overflow-y-auto md:overscroll-contain md:py-5 md:pr-4 md:pl-1">
        <nav
          aria-label={t(($) => $.navigation.main)}
          className="flex flex-col gap-3"
        >
          <Link
            to={ROUTES.overview}
            onClick={() => setMobileSidebarOpen(false)}
            className={buttonVariants({
              variant: "ghost",
              className:
                "w-full h-9 justify-start gap-2 px-4 data-[status=active]:bg-accent data-[status=active]:text-accent-foreground",
            })}
          >
            <Rectangles4 className="size-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">{t(($) => $.navigation.overview)}</span>
            <Circle
              className="hidden size-4 shrink-0 in-[[data-status=active]]:block"
              aria-hidden="true"
            />
          </Link>
          <Link
            to={ROUTES.calendar}
            onClick={() => setMobileSidebarOpen(false)}
            className={buttonVariants({
              variant: "ghost",
              className:
                "w-full h-9 justify-start gap-2 px-4 data-[status=active]:bg-accent data-[status=active]:text-accent-foreground",
            })}
          >
            <Calendar className="size-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">{t(($) => $.navigation.calendar)}</span>
            <Circle
              className="hidden size-4 shrink-0 in-[[data-status=active]]:block"
              aria-hidden="true"
            />
          </Link>
          <Link
            to={ROUTES.disciplines}
            onClick={() => setMobileSidebarOpen(false)}
            className={buttonVariants({
              variant: "ghost",
              className:
                "w-full h-9 justify-start gap-2 px-4 data-[status=active]:bg-accent data-[status=active]:text-accent-foreground",
            })}
          >
            <ChartLine className="size-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">{t(($) => $.navigation.disciplines)}</span>
            <Circle
              className="hidden size-4 shrink-0 in-[[data-status=active]]:block"
              aria-hidden="true"
            />
          </Link>
          <Button
            variant="ghost"
            isDisabled
            className="h-9 justify-start gap-2 rounded-3xl px-4 opacity-100 md:opacity-50"
          >
            <LayoutList className="size-4 shrink-0" aria-hidden="true" />
            {t(($) => $.navigation.plans)}
          </Button>
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
          </div>
        </section>
      </div>
    </aside>
  );
}
