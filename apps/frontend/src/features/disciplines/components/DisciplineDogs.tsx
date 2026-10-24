import { useId } from "react";
import type { DisciplineDog } from "../api/disciplinesQueryOptions";
import { Dog } from "lucide-react";
import { useTranslation } from "react-i18next";

import { czechFrom, pluralForm } from "@/lib/plural";

import { useSession } from "@/features/auth/hooks/useSession";
import { DogAvatar } from "@/features/dogs/components/DogAvatar";
import { useDogs } from "@/features/dogs/hooks/useDogs";

/** Dogs that picked at least one goal of the discipline, with how much of it. */
export function DisciplineDogs({
  dogs,
  goalTotal,
  exerciseTotal,
}: {
  dogs: DisciplineDog[];
  goalTotal: number;
  exerciseTotal: number;
}) {
  const { t } = useTranslation();
  const headingId = useId();
  const { user } = useSession();
  // The avatar comes from the dogs list (already loaded by the sidebar), which
  // is the query a photo change refreshes.
  const { data: ownDogs } = useDogs(user?.id);
  const dogsById = new Map(ownDogs?.map((dog) => [dog.id, dog]));

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
          <Dog className="mt-1 size-4 shrink-0" aria-hidden="true" />
          {t(($) => $.disciplines.dogsEmpty)}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {dogs.map((dog) => (
            <li key={dog.id} className="flex items-center gap-3">
              <DogAvatar dog={dogsById.get(dog.id) ?? dog} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm leading-6 wrap-break-word">
                  {dog.name}
                </span>
                <DogProgress
                  dog={dog}
                  goalTotal={goalTotal}
                  exerciseTotal={exerciseTotal}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DogProgress({
  dog,
  goalTotal,
  exerciseTotal,
}: {
  dog: DisciplineDog;
  goalTotal: number;
  exerciseTotal: number;
}) {
  const { t } = useTranslation();

  return (
    <span className="text-xs leading-5 text-muted">
      {t(($) => $.disciplines.dogProgress, {
        goals: t(($) => $.disciplines.dogGoalsOf[pluralForm(goalTotal)], {
          count: dog.goalCount,
          total: goalTotal,
          from: czechFrom(goalTotal),
        }),
        exercises: t(
          ($) => $.disciplines.dogExercisesOf[pluralForm(exerciseTotal)],
          {
            count: dog.exerciseCount,
            total: exerciseTotal,
            from: czechFrom(exerciseTotal),
          },
        ),
      })}
    </span>
  );
}
