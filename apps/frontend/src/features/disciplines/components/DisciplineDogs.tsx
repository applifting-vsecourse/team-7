import { useId } from "react";
import type { DisciplineDog } from "../api/disciplinesQueryOptions";
import { toast } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { DogIcon } from "@/components/DogIcon";
import { czechFrom, pluralForm } from "@/lib/plural";

import { useSession } from "@/features/auth/hooks/useSession";
import type { Dog } from "@/features/dogs/api/dogsQueryOptions";
import { DogAvatar } from "@/features/dogs/components/DogAvatar";
import { useDogs } from "@/features/dogs/hooks/useDogs";

import { useDialogState } from "../hooks/useDialogState";
import { useRemoveDiscipline } from "../hooks/useLibraryMutations";
import { DeleteDialog } from "./DeleteDialog";
import { ItemMenu } from "./ItemMenu";

type Totals = { goalTotal: number; exerciseTotal: number };

/** Dogs that picked at least one goal of the discipline, with how much of it. */
export function DisciplineDogs({
  discipline,
  dogs,
  ...totals
}: Totals & {
  discipline: { id: string; name: string };
  dogs: DisciplineDog[];
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
          <DogIcon className="mt-1 size-4 shrink-0" aria-hidden="true" />
          {t(($) => $.disciplines.dogsEmpty)}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {dogs.map((dog) => (
            <DogRow
              key={dog.id}
              discipline={discipline}
              dog={dog}
              avatarDog={dogsById.get(dog.id) ?? dog}
              {...totals}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function DogRow({
  discipline,
  dog,
  avatarDog,
  ...totals
}: Totals & {
  discipline: { id: string; name: string };
  dog: DisciplineDog;
  avatarDog: Dog;
}) {
  const { t } = useTranslation();
  const { dialog, open, close, onOpenChange } = useDialogState<"remove">();
  const remove = useRemoveDiscipline();
  const names = { discipline: discipline.name, dog: dog.name };

  return (
    <li className="flex items-center gap-3">
      <DogAvatar dog={avatarDog} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm leading-6 wrap-break-word">{dog.name}</span>
        <DogProgress dog={dog} {...totals} />
      </div>
      <ItemMenu
        label={t(($) => $.disciplines.dogActions, { name: dog.name })}
        deleteLabel={t(($) => $.disciplines.removeFromDog)}
        onDelete={() => {
          remove.reset();
          open("remove");
        }}
      />
      <DeleteDialog
        isOpen={dialog === "remove"}
        onOpenChange={onOpenChange}
        title={t(($) => $.disciplines.removeDialog.title, names)}
        body={t(($) => $.disciplines.removeDialog.body, names)}
        affectedDogCount={0}
        confirmLabel={t(($) => $.disciplines.removeDialog.confirm)}
        isPending={remove.isPending}
        isError={remove.isError}
        onConfirm={() =>
          remove.mutate(
            { disciplineId: discipline.id, dogId: dog.id },
            {
              onSuccess: () => {
                close();
                toast.success(t(($) => $.disciplines.removedToast, names));
              },
            },
          )
        }
      />
    </li>
  );
}

function DogProgress({
  dog,
  goalTotal,
  exerciseTotal,
}: Totals & { dog: DisciplineDog }) {
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
