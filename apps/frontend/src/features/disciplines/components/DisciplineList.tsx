import type { DisciplineSummary } from "../api/disciplinesQueryOptions";
import { ChartLine, Plus } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { useSession } from "@/features/auth/hooks/useSession";

import { useCatalog } from "../hooks/useCatalog";
import { useDisciplines } from "../hooks/useDisciplines";
import { DisciplineCard } from "./DisciplineCard";
import { EmptyState } from "./EmptyState";

type Group = { key: string; name: string; items: DisciplineSummary[] };

export function DisciplineList({
  onBrowseCatalog,
  onCreate,
}: {
  onBrowseCatalog: () => void;
  onCreate: () => void;
}) {
  const { t } = useTranslation();
  const { user } = useSession();
  const { data, isPending, isError, refetch } = useDisciplines(user?.id);
  const catalog = useCatalog();

  if (isPending || catalog.isPending) {
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
        <Button variant="secondary" onPress={() => void refetch()}>
          {t(($) => $.disciplines.retry)}
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={ChartLine}
        title={t(($) => $.disciplines.emptyTitle)}
        description={t(($) => $.disciplines.emptyDescription)}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button onPress={onBrowseCatalog}>
              {t(($) => $.disciplines.pickFromCatalog)}
            </Button>
            <Button variant="secondary" onPress={onCreate}>
              <Plus className="size-4 shrink-0" aria-hidden="true" />
              {t(($) => $.disciplines.newDiscipline)}
            </Button>
          </div>
        }
      />
    );
  }

  // Without the catalog the category names are unknown: one plain list.
  if (!catalog.data) return <Cards items={data} heading="h2" />;

  const known = new Set(catalog.data.map((category) => category.key));
  const groups: Group[] = [
    ...catalog.data.map((category) => ({
      key: category.key,
      name: category.name,
      items: data.filter((item) => item.category === category.key),
    })),
    {
      key: "own",
      name: t(($) => $.disciplines.ownCategory),
      items: data.filter((item) => !known.has(item.category ?? "")),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section
          key={group.key}
          aria-labelledby={`category-${group.key}`}
          className="flex flex-col gap-4"
        >
          <h2
            id={`category-${group.key}`}
            className="text-2xl leading-8 font-semibold tracking-tight"
          >
            {group.name}
          </h2>
          <Cards items={group.items} heading="h3" />
        </section>
      ))}
    </div>
  );
}

function Cards({
  items,
  heading,
}: {
  items: DisciplineSummary[];
  heading: "h2" | "h3";
}) {
  return (
    <ul className="grid stagger grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {items.map((discipline) => (
        <li key={discipline.id} className="flex min-w-0 flex-col">
          <DisciplineCard discipline={discipline} heading={heading} />
        </li>
      ))}
    </ul>
  );
}
