import { useId } from "react";
import {
  Calendar,
  ChartLine,
  Circle,
  LayoutList,
  Rectangles4,
} from "@gravity-ui/icons";
import { Button, Separator } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { mobileSidebarOpenAtom } from "@/app/atoms/mobileSidebarOpenAtom";
import { ROUTES } from "@/app/routes";

import { AddDogDialog } from "@/features/dogs/components/AddDogDialog";
import { SidebarDogs } from "@/features/dogs/components/SidebarDogs";

export function Sidebar() {
  const { t } = useTranslation();
  const headingId = useId();
  const setMobileSidebarOpen = useSetAtom(mobileSidebarOpenAtom);

  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 md:w-sidebar md:py-5 md:pr-4">
      <nav
        aria-label={t(($) => $.navigation.main)}
        className="flex flex-col gap-3"
      >
        <Link
          to={ROUTES.overview}
          onClick={() => setMobileSidebarOpen(false)}
          aria-current="page"
          className="flex h-9 items-center gap-2 rounded-3xl bg-accent px-4 text-sm font-medium text-accent-foreground"
        >
          <Rectangles4 className="size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">{t(($) => $.navigation.overview)}</span>
          <Circle className="size-4 shrink-0" aria-hidden="true" />
        </Link>
        <Button
          variant="ghost"
          isDisabled
          className="h-9 justify-start gap-2 rounded-3xl px-4 opacity-100 md:opacity-50"
        >
          <Calendar className="size-4 shrink-0" aria-hidden="true" />
          {t(($) => $.navigation.calendar)}
        </Button>
        <Button
          variant="ghost"
          isDisabled
          className="h-9 justify-start gap-2 rounded-3xl px-4 opacity-100 md:opacity-50"
        >
          <ChartLine className="size-4 shrink-0" aria-hidden="true" />
          {t(($) => $.navigation.disciplines)}
        </Button>
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
          <AddDogDialog />
        </div>
      </section>
    </aside>
  );
}
