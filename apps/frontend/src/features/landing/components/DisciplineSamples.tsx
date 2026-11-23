import { useState } from "react";
import { Button, Tabs, Tag, TagGroup } from "@heroui/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { withViewTransition } from "@/lib/motion";
import { czechFrom } from "@/lib/plural";
import { cn } from "@/lib/utils";

import {
  catalogLanguage,
  catalogQueryOptions,
} from "@/features/catalog/api/catalogQueryOptions";
import { CatalogDisciplinePreview } from "@/features/catalog/components/CatalogDisciplinePreview";

/**
 * Landing samples of the discipline catalog (Figma F-63 856:555, mobile
 * 856:959): a tab per category, chips for its disciplines and a read-only
 * preview of the picked one. The pick is not persisted.
 */
export function DisciplineSamples() {
  const { t, i18n } = useTranslation();
  const { data, isPending, isError, isPlaceholderData, refetch } = useQuery({
    ...catalogQueryOptions(catalogLanguage(i18n.resolvedLanguage ?? "cs")),
    placeholderData: keepPreviousData,
  });
  // Keys survive a language switch; unset or unknown keys fall back to the first item.
  const [picked, setPicked] = useState<{
    category?: string;
    discipline?: string;
  }>({});

  const categories = data ?? [];
  const categoryIndex = Math.max(
    0,
    categories.findIndex((c) => c.key === picked.category),
  );
  const category = categories[categoryIndex];
  const disciplineIndex = Math.max(
    0,
    category?.disciplines.findIndex((d) => d.key === picked.discipline) ?? 0,
  );
  const discipline = category?.disciplines[disciplineIndex];
  const disciplineCount = categories.reduce(
    (sum, c) => sum + c.disciplines.length,
    0,
  );

  // The preview slides in the direction of the newly picked tab or chip.
  const pick = (next: typeof picked, forward: boolean) =>
    void withViewTransition(
      () => setPicked(next),
      [forward ? "forward" : "back"],
    );

  let content;
  if (isPending) {
    content = (
      <p role="status" className="text-sm text-muted">
        {t(($) => $.landing.samples.loading)}
      </p>
    );
  } else if (isError) {
    content = (
      <div
        role="alert"
        className="flex animate-enter flex-col items-start gap-3"
      >
        <p className="text-sm text-danger">
          {t(($) => $.landing.samples.loadError)}
        </p>
        <Button variant="secondary" onPress={() => void refetch()}>
          {t(($) => $.landing.samples.retry)}
        </Button>
      </div>
    );
  } else if (!category) {
    content = (
      <p className="animate-enter text-sm text-muted">
        {t(($) => $.landing.samples.empty)}
      </p>
    );
  } else {
    content = (
      <Tabs
        className={cn("gap-8 state-dim", isPlaceholderData && "opacity-60")}
        aria-busy={isPlaceholderData}
        selectedKey={category.key}
        onSelectionChange={(key) =>
          pick(
            { category: String(key) },
            categories.findIndex((c) => c.key === key) > categoryIndex,
          )
        }
      >
        {/* Every area visible without scrolling: 2 per row on phones, 3 on
            tablets, all in one row from desktop. Tabs grow to fill their row,
            so a row with fewer tabs leaves no gap; long names wrap. */}
        <Tabs.ListContainer className="w-full">
          <Tabs.List
            aria-label={t(($) => $.catalog.categories)}
            className="flex w-full flex-wrap gap-1"
          >
            {categories.map((c) => (
              <Tabs.Tab
                key={c.key}
                id={c.key}
                className="h-auto min-h-8 grow basis-2/5 px-3 py-1.5 leading-5 sm:basis-1/4 lg:basis-0"
              >
                {c.name}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
        {categories.map((c) => (
          <Tabs.Panel
            key={c.key}
            id={c.key}
            className="mt-0 flex flex-col gap-6 p-0"
          >
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted">{c.description}</p>
              <TagGroup
                aria-label={t(($) => $.catalog.disciplinesIn, { name: c.name })}
                selectionMode="single"
                disallowEmptySelection
                selectedKeys={discipline ? [discipline.key] : []}
                onSelectionChange={(keys) => {
                  const [key] = keys;
                  if (key === undefined || key === discipline?.key) return;
                  pick(
                    { category: c.key, discipline: String(key) },
                    c.disciplines.findIndex((d) => d.key === key) >
                      disciplineIndex,
                  );
                }}
              >
                <TagGroup.List>
                  {c.disciplines.map((d) => (
                    <Tag key={d.key} id={d.key}>
                      {d.shortName}
                    </Tag>
                  ))}
                </TagGroup.List>
              </TagGroup>
            </div>
            {discipline ? (
              <CatalogDisciplinePreview
                discipline={discipline}
                className="period-transition"
              />
            ) : null}
          </Tabs.Panel>
        ))}
      </Tabs>
    );
  }

  return (
    <section
      aria-labelledby="landing-samples"
      className="flex w-full max-w-content flex-col gap-8 rounded-3xl bg-background px-6 py-16 md:p-16"
    >
      <div className="flex max-w-2xl flex-col gap-3">
        <h2
          id="landing-samples"
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {t(($) => $.landing.samples.heading)}
        </h2>
        {disciplineCount > 0 ? (
          <p className="text-muted">
            {t(($) => $.landing.samples.lead, {
              count: disciplineCount,
              from: czechFrom(disciplineCount),
              categoryCount: categories.length,
            })}
          </p>
        ) : null}
      </div>
      {content}
    </section>
  );
}
