import type { Goal } from "../api/disciplinesQueryOptions";
import { Flag, Plus } from "@gravity-ui/icons";
import { Button, Separator } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { useDialogState } from "../hooks/useDialogState";
import { useDeleteGoal } from "../hooks/useLibraryMutations";
import { DeleteDialog } from "./DeleteDialog";
import { ExerciseList } from "./ExerciseList";
import { ItemMenu } from "./ItemMenu";
import { ExerciseDialog, GoalDialog } from "./LibraryDialogs";

export function GoalCard({
  discipline,
  goal,
}: {
  discipline: { id: string; name: string };
  goal: Goal;
}) {
  const { t } = useTranslation();
  const { dialog, open, close, onOpenChange } = useDialogState<
    "edit" | "delete" | "addExercise"
  >();
  const remove = useDeleteGoal();

  return (
    <article
      aria-label={goal.name}
      className="flex flex-col gap-4 rounded-2xl bg-background p-4 shadow-surface"
    >
      <div className="flex items-start gap-3">
        <Flag
          className="mt-1 size-5 shrink-0 text-warning"
          aria-hidden="true"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-base leading-7 font-medium">{goal.name}</h3>
          {goal.criterion ? (
            <p className="text-sm leading-6 text-muted">{goal.criterion}</p>
          ) : null}
        </div>
        <ItemMenu
          label={t(($) => $.disciplines.goalActions, { name: goal.name })}
          onEdit={() => open("edit")}
          onDelete={() => {
            remove.reset();
            open("delete");
          }}
        />
      </div>
      <Separator />
      <ExerciseList goal={goal} />
      <Button
        variant="outline"
        className="self-start"
        onPress={() => open("addExercise")}
      >
        <Plus className="size-4" aria-hidden="true" />
        {t(($) => $.disciplines.addExercise)}
      </Button>
      <GoalDialog
        isOpen={dialog === "edit"}
        onOpenChange={onOpenChange}
        discipline={discipline}
        goal={goal}
      />
      <ExerciseDialog
        isOpen={dialog === "addExercise"}
        onOpenChange={onOpenChange}
        goal={goal}
      />
      <DeleteDialog
        isOpen={dialog === "delete"}
        onOpenChange={onOpenChange}
        title={t(($) => $.disciplines.deleteDialog.goalTitle, {
          name: goal.name,
        })}
        body={t(($) => $.disciplines.deleteDialog.goalBody)}
        affectedDogCount={goal.dogs.length}
        isPending={remove.isPending}
        isError={remove.isError}
        onConfirm={() => remove.mutate(goal.id, { onSuccess: close })}
      />
    </article>
  );
}
