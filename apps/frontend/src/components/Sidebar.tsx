import {
  Calendar,
  ChartLine,
  Circle,
  LayoutList,
  Plus,
  Rectangles4,
} from "@gravity-ui/icons";
import { Button, Separator } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";

export function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 py-5 md:w-sidebar md:pr-4">
      <nav
        aria-label={t(($) => $.navigation.main)}
        className="grid grid-cols-2 gap-3 md:flex md:flex-col"
      >
        <Link
          to={ROUTES.overview}
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
          className="h-9 justify-start gap-2 rounded-3xl px-4"
        >
          <Calendar className="size-4 shrink-0" aria-hidden="true" />
          {t(($) => $.navigation.calendar)}
        </Button>
        <Button
          variant="ghost"
          isDisabled
          className="h-9 justify-start gap-2 rounded-3xl px-4"
        >
          <ChartLine className="size-4 shrink-0" aria-hidden="true" />
          {t(($) => $.navigation.disciplines)}
        </Button>
        <Button
          variant="ghost"
          isDisabled
          className="h-9 justify-start gap-2 rounded-3xl px-4"
        >
          <LayoutList className="size-4 shrink-0" aria-hidden="true" />
          {t(($) => $.navigation.plans)}
        </Button>
      </nav>
      <section
        aria-labelledby="my-dogs-heading"
        className="flex flex-col gap-6"
      >
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <h2
            id="my-dogs-heading"
            className="shrink-0 text-xs font-medium text-muted"
          >
            {t(($) => $.navigation.myDogs)}
          </h2>
          <Separator className="flex-1" />
        </div>
        <Button
          variant="secondary"
          isDisabled
          className="h-9 w-full gap-2 rounded-3xl"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t(($) => $.navigation.addDog)}
        </Button>
      </section>
    </aside>
  );
}
