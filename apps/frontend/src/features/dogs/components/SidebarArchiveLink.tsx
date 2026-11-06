import type { CSSProperties } from "react";
import { Archive, Circle } from "@gravity-ui/icons";
import { buttonVariants } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { mobileSidebarOpenAtom } from "@/app/atoms/mobileSidebarOpenAtom";
import { ROUTES } from "@/app/routes";

import { useSession } from "@/features/auth/hooks/useSession";

import { archivedDogsQueryOptions } from "../api/dogsQueryOptions";

/** Shown only while at least one dog is archived; styled like the main navigation. */
export function SidebarArchiveLink({
  activeProps,
}: {
  activeProps?: { style: CSSProperties };
}) {
  const { t } = useTranslation();
  const { user } = useSession();
  const { data } = useQuery(archivedDogsQueryOptions(user?.id));
  const setMobileSidebarOpen = useSetAtom(mobileSidebarOpenAtom);
  if (!data?.length) return null;
  return (
    <Link
      to={ROUTES.dogArchive}
      onClick={() => setMobileSidebarOpen(false)}
      activeProps={activeProps}
      className={buttonVariants({
        variant: "ghost",
        className:
          "w-full h-9 justify-start gap-2 px-4 data-[status=active]:bg-accent data-[status=active]:text-accent-foreground",
      })}
    >
      <Archive className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">
        {t(($) => $.navigation.archive, { count: data.length })}
      </span>
      <Circle
        className="hidden size-4 shrink-0 in-data-[status=active]:block"
        aria-hidden="true"
      />
    </Link>
  );
}
