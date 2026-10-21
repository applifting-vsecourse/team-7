import { CircleDashed } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useSession } from "@/features/auth/hooks/useSession";

import { disciplinesQueryOptions } from "../api/disciplinesQueryOptions";
import { DisciplineCard } from "./DisciplineCard";
import { EmptyState } from "./EmptyState";

export function DisciplineList() {
  const { t } = useTranslation();
  const { user } = useSession();
  const { data, isPending, isError, refetch } = useQuery(
    disciplinesQueryOptions(user?.id),
  );

  if (isPending) {
    return (
      <p role="status" className="text-sm text-muted">
        {t(($) => $.disciplines.loading)}
      </p>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-sm text-danger">
          {t(($) => $.disciplines.loadError)}
        </p>
        <Button variant="secondary" size="sm" onPress={() => void refetch()}>
          {t(($) => $.disciplines.retry)}
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={CircleDashed}
        title={t(($) => $.disciplines.emptyTitle)}
        description={t(($) => $.disciplines.emptyDescription)}
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {data.map((discipline) => (
        <li key={discipline.id} className="flex min-w-0 flex-col">
          <DisciplineCard discipline={discipline} />
        </li>
      ))}
    </ul>
  );
}
