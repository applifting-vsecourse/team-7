import { useId } from "react";
import type { DisciplineDog } from "../api/disciplinesQueryOptions";
import { CircleDashed } from "@gravity-ui/icons";
import { useTranslation } from "react-i18next";

import { pluralForm } from "@/lib/plural";

/** Dogs that picked at least one goal of the discipline, with their progress. */
export function DisciplineDogs({ dogs }: { dogs: DisciplineDog[] }) {
  const { t } = useTranslation();
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2
        id={headingId}
        className="text-lg leading-7 font-semibold tracking-tight"
      >
        {t(($) => $.disciplines.dogs)}
      </h2>
      {dogs.length === 0 ? (
        <p className="flex items-start gap-1 text-sm leading-6 text-muted">
          <CircleDashed className="mt-1 size-4 shrink-0" aria-hidden="true" />
          {t(($) => $.disciplines.dogsEmpty)}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {dogs.map((dog) => (
            <li key={dog.id} className="flex flex-col">
              <span className="text-sm leading-6 font-medium wrap-break-word">
                {dog.text}
              </span>
              <span className="text-xs leading-5 text-muted">
                {t(($) => $.disciplines.dogProgress, {
                  goals: t(
                    ($) => $.disciplines.goalCount[pluralForm(dog.goalCount)],
                    { count: dog.goalCount },
                  ),
                  completed: dog.completedGoalCount,
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
