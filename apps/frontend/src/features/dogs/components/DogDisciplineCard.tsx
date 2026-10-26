import type { DogDiscipline } from "../api/dogProfileQueryOptions";
import { ChevronRight, CircleCheck, Clock } from "@gravity-ui/icons";
import { Chip, Separator } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { cn, transitionName } from "@/lib/utils";

import { AverageRating } from "./AverageRating";
import { LastTraining } from "./LastTraining";

export const isDisciplineDone = (discipline: DogDiscipline) =>
  discipline.goalCount > 0 &&
  discipline.completedGoalCount === discipline.goalCount;

export function DogDisciplineCard({
  dogId,
  discipline,
}: {
  dogId: string;
  discipline: DogDiscipline;
}) {
  const { t } = useTranslation();
  const done = isDisciplineDone(discipline);
  return (
    <Link
      to="/dogs/$dogId/disciplines/$disciplineId"
      params={{ dogId, disciplineId: discipline.id }}
      className={cn(
        "flex min-w-0 interactive-lift flex-col gap-3 rounded-2xl p-4 text-foreground shadow-card outline-none focus-visible:focus-ring",
        done ? "bg-event-tile-success" : "bg-background",
      )}
    >
      <div className="flex items-center gap-3">
        <h3 className="min-w-0 flex-1 text-xl leading-7 font-semibold tracking-tight wrap-break-word">
          <span
            className="inline-block"
            style={transitionName("discipline", discipline.id)}
          >
            {discipline.name}
          </span>
        </h3>
        {done && (
          <Chip size="sm" className="shine bg-success">
            <CircleCheck className="size-3" aria-hidden="true" />
            <Chip.Label>{t(($) => $.dogProfile.done)}</Chip.Label>
          </Chip>
        )}
        <ChevronRight
          className="size-4 shrink-0 hover-nudge text-accent"
          aria-hidden="true"
        />
      </div>
      <p className="text-sm leading-6 text-muted">
        {t(($) => $.dogProfile.completedGoalsSummary, {
          completed: discipline.completedGoalCount,
          total: discipline.goalCount,
        })}
      </p>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm leading-6">
          <span className="font-medium">
            {t(($) => $.dogProfile.averageRating)}
          </span>
          <AverageRating
            rating={discipline.averageRating}
            emptyLabel={t(($) => $.dogProfile.noRating)}
            className="text-muted"
          />
        </div>
        <p className="text-xs leading-5 text-muted">
          {t(($) => $.dogProfile.ratingPeriod)}
        </p>
      </div>
      <Separator className="my-1" />
      <p className="flex items-center gap-2 text-xs leading-5 text-accent-soft-foreground">
        <Clock className="size-4 shrink-0 text-accent" aria-hidden="true" />
        <LastTraining date={discipline.lastTrainingAt} />
      </p>
    </Link>
  );
}
