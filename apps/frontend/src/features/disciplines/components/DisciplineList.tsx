import type { ReactNode } from "react";
import type { DisciplineSummary } from "../api/disciplinesQueryOptions";
import { ChartLine } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { useSession } from "@/features/auth/hooks/useSession";

import { useCatalog } from "../hooks/useCatalog";
import { useDisciplines } from "../hooks/useDisciplines";
import { DisciplineCard } from "./DisciplineCard";
import { EmptyState } from "./EmptyState";

type Group = { key: string; name: string; items: DisciplineSummary[] };

/** "My library" section of the disciplines page, grouped by catalog category. */
export function DisciplineList() {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="library-heading" className="flex flex-col gap-4">
      <h2
        id="library-heading"
        className="text-xl leading-7 font-semibold tracking-tight"
      >
        {t(($) => $.disciplines.libraryTitle)}
      </h2>
      <LibraryContent />
    </section>
  );
}

function LibraryContent(): ReactNode {
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
    // The catalog right below and the header button are the way out.
    return (
      <EmptyState
        icon={ChartLine}
        title={t(($) => $.disciplines.emptyTitle)}
        description={t(($) => $.disciplines.emptyDescription)}
      />
    );
  }

  // Without the catalog the category names are unknown: one plain list.
  if (!catalog.data) return <Cards items={data} heading="h3" />;

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
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section
          key={group.key}
          aria-labelledby={`category-${group.key}`}
          className="flex flex-col gap-3"
        >
          {/* The one small label style (DESIGN.md): a group label must not
              outweigh the card titles under it. */}
          <h3
            id={`category-${group.key}`}
            className="text-xs leading-5 font-semibold tracking-widest text-muted uppercase"
          >
            {group.name}
          </h3>
          <Cards items={group.items} heading="h4" />
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
  heading: "h3" | "h4";
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
