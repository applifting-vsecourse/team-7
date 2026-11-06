import { Archive } from "@gravity-ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import { NavLink } from "@/components/NavLink";

import { useSession } from "@/features/auth/hooks/useSession";

import { archivedDogsQueryOptions } from "../api/dogsQueryOptions";

/** Shown only while at least one dog is archived. */
export function SidebarArchiveLink() {
  const { t } = useTranslation();
  const { user } = useSession();
  const { data } = useQuery(archivedDogsQueryOptions(user?.id));
  if (!data?.length) return null;
  return (
    <NavLink to={ROUTES.dogArchive} icon={Archive}>
      {t(($) => $.navigation.archive, { count: data.length })}
    </NavLink>
  );
}
