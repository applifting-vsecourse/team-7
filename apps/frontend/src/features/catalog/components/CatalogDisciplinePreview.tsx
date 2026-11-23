import type { CatalogDiscipline } from "../api/catalogQueryOptions";
import { Circle, Flag } from "@gravity-ui/icons";
import { Separator } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { pluralForm } from "@/lib/plural";
import { cn } from "@/lib/utils";

/**
 * Read-only preview of a catalog discipline: name, goal / exercise counts and
 * its goals as cards (Figma F-63 samples 856:555 / 856:959). Unlike the
 * library's GoalCard it has no menus, descriptions or add buttons.
 */
export function CatalogDisciplinePreview({
  discipline,
  className,
}: {
  discipline: CatalogDiscipline;
  className?: string;
}) {
  const { t } = useTranslation();
  const exerciseCount = discipline.goals.reduce(
    (sum, goal) => sum + goal.exercises.length,
    0,
  );

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-3">
        <h3 className="text-xl leading-7 font-semibold tracking-tight">
          {discipline.name}
        </h3>
        <p className="text-sm text-muted">
          {t(
            ($) => $.disciplines.goalCount[pluralForm(discipline.goals.length)],
            {
              count: discipline.goals.length,
            },
          )}
          {" · "}
          {t(($) => $.disciplines.exerciseCount[pluralForm(exerciseCount)], {
            count: exerciseCount,
          })}
        </p>
      </div>
      <ul className="grid items-start gap-4 md:grid-cols-3 md:gap-6">
        {discipline.goals.map((goal) => (
          <li
            key={goal.name}
            className="flex min-w-0 flex-col gap-4 rounded-2xl bg-surface p-4 shadow-surface"
          >
            <div className="flex items-start gap-3">
              <Flag
                className="mt-1 size-5 shrink-0 text-warning"
                aria-hidden="true"
              />
              <h4 className="min-w-0 flex-1 text-base leading-7 font-medium">
                {goal.name}
              </h4>
            </div>
            <Separator />
            <ul className="flex flex-col gap-4">
              {goal.exercises.map((exercise) => (
                <li key={exercise.name} className="flex items-start gap-3">
                  <Circle
                    className="mt-1 size-4 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                  <p className="min-w-0 flex-1 text-sm leading-6 font-medium">
                    {exercise.name}
                  </p>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
