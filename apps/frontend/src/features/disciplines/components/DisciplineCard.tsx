import { useRef } from "react";
import type { DisciplineSummary } from "../api/disciplinesQueryOptions";
import { ChevronRight, Flag, ListUl } from "@gravity-ui/icons";
import { Alert, Separator } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import { DogIcon } from "@/components/DogIcon";
import { openMorph, reopenedMorph } from "@/lib/motion";
import { pluralForm } from "@/lib/plural";

/** Library list item; the whole card links to the discipline detail. */
export function DisciplineCard({
  discipline,
}: {
  discipline: DisciplineSummary;
}) {
  const { t, i18n } = useTranslation();
  const titleRef = useRef<HTMLSpanElement>(null);
  const dogNames = new Intl.ListFormat(i18n.resolvedLanguage ?? "cs", {
    style: "short",
    type: "unit",
  }).format(discipline.dogs.map((dog) => dog.name));

  return (
    <Link
      to={ROUTES.discipline}
      params={{ disciplineId: discipline.id }}
      onClick={() => openMorph(titleRef.current, "discipline", discipline.id)}
      className="flex min-w-0 flex-1 interactive-lift cursor-pointer flex-col gap-3 rounded-2xl bg-background p-4 text-foreground shadow-card outline-none focus-visible:focus-ring"
    >
      {/* Grows so the footer lines up across cards in a row. */}
      <div className="flex flex-1 items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="text-xl leading-7 font-semibold tracking-tight wrap-break-word">
            {/* Morphs into the detail heading; inline-block keeps the box to the text. */}
            <span
              ref={titleRef}
              className="inline-block"
              style={reopenedMorph("discipline", discipline.id)}
            >
              {discipline.name}
            </span>
          </h2>
          {discipline.description ? (
            <p className="text-sm leading-6 wrap-break-word">
              {discipline.description}
            </p>
          ) : null}
        </div>
        <ChevronRight
          className="size-4 shrink-0 hover-nudge text-accent"
          aria-hidden="true"
        />
      </div>
      {discipline.dogs.length > 0 ? (
        <p className="flex items-center gap-1 text-sm leading-6 text-muted">
          <DogIcon className="size-4 shrink-0 text-accent" aria-hidden="true" />
          <span className="min-w-0 flex-1 wrap-break-word">{dogNames}</span>
        </p>
      ) : null}
      <Separator />
      {discipline.goalCount === 0 ? (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t(($) => $.disciplines.emptyDiscipline)}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm leading-6">
          <span className="flex items-center gap-1">
            <Flag className="size-4 shrink-0 text-warning" aria-hidden="true" />
            {t(
              ($) => $.disciplines.goalCount[pluralForm(discipline.goalCount)],
              {
                count: discipline.goalCount,
              },
            )}
          </span>
          <span className="flex items-center gap-1">
            <ListUl
              className="size-4 shrink-0 text-success"
              aria-hidden="true"
            />
            {t(
              ($) =>
                $.disciplines.exerciseCount[
                  pluralForm(discipline.exerciseCount)
                ],
              { count: discipline.exerciseCount },
            )}
          </span>
        </p>
      )}
    </Link>
  );
}
