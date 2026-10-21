import { useState } from "react";
import type { Exercise, Goal } from "../api/disciplinesQueryOptions";
import { Circle } from "@gravity-ui/icons";
import { useTranslation } from "react-i18next";

import { useDeleteExercise } from "../hooks/useLibraryMutations";
import { DeleteDialog } from "./DeleteDialog";
import { ItemMenu } from "./ItemMenu";
import { ExerciseDialog } from "./LibraryDialogs";

export function ExerciseRow({
  goal,
  exercise,
}: {
  goal: Goal;
  exercise: Exercise;
}) {
  const { t } = useTranslation();
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const remove = useDeleteExercise();
  const close = (open: boolean) => {
    if (!open) setDialog(null);
  };

  return (
    <li className="flex items-start gap-3">
      <Circle className="mt-1 size-4 shrink-0 text-muted" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm leading-6 font-medium wrap-break-word">
          {exercise.name}
        </p>
        {exercise.procedure ? (
          <p className="line-clamp-1 text-xs leading-5 text-muted">
            {exercise.procedure}
          </p>
        ) : null}
      </div>
      <ItemMenu
        label={t(($) => $.disciplines.exerciseActions, {
          name: exercise.name,
        })}
        onEdit={() => setDialog("edit")}
        onDelete={() => {
          remove.reset();
          setDialog("delete");
        }}
      />
      <ExerciseDialog
        isOpen={dialog === "edit"}
        onOpenChange={close}
        goal={goal}
        exercise={exercise}
      />
      <DeleteDialog
        isOpen={dialog === "delete"}
        onOpenChange={close}
        title={t(($) => $.disciplines.deleteDialog.exerciseTitle, {
          name: exercise.name,
        })}
        body={t(($) => $.disciplines.deleteDialog.exerciseBody)}
        affectedDogCount={exercise.dogCount}
        isPending={remove.isPending}
        isError={remove.isError}
        onConfirm={() =>
          remove.mutate(exercise.id, { onSuccess: () => setDialog(null) })
        }
      />
    </li>
  );
}
