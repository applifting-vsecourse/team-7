import { useState } from "react";
import type { Goal } from "../api/disciplinesQueryOptions";
import { Flag, Plus } from "@gravity-ui/icons";
import { Alert, Button, Separator } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { useDeleteGoal } from "../hooks/useLibraryMutations";
import { DeleteDialog } from "./DeleteDialog";
import { ExerciseRow } from "./ExerciseRow";
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
  const [dialog, setDialog] = useState<
    "edit" | "delete" | "addExercise" | null
  >(null);
  const remove = useDeleteGoal();
  const close = (open: boolean) => {
    if (!open) setDialog(null);
  };

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
          <h3 className="text-base leading-7 font-medium wrap-break-word">
            {goal.name}
          </h3>
          {goal.criterion ? (
            <p className="text-sm leading-6 wrap-break-word text-muted">
              {goal.criterion}
            </p>
          ) : null}
        </div>
        <ItemMenu
          label={t(($) => $.disciplines.goalActions, { name: goal.name })}
          onEdit={() => setDialog("edit")}
          onDelete={() => {
            remove.reset();
            setDialog("delete");
          }}
        />
      </div>
      <Separator />
      {goal.exercises.length === 0 ? (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>
              {t(($) => $.disciplines.goalNoExercisesTitle)}
            </Alert.Title>
            <Alert.Description>
              {t(($) => $.disciplines.goalNoExercisesDescription)}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : (
        <ul className="flex flex-col gap-4">
          {goal.exercises.map((exercise) => (
            <ExerciseRow key={exercise.id} goal={goal} exercise={exercise} />
          ))}
        </ul>
      )}
      <Button
        variant="outline"
        className="self-start"
        onPress={() => setDialog("addExercise")}
      >
        <Plus className="size-4" aria-hidden="true" />
        {t(($) => $.disciplines.addExercise)}
      </Button>
      <GoalDialog
        isOpen={dialog === "edit"}
        onOpenChange={close}
        discipline={discipline}
        goal={goal}
      />
      <ExerciseDialog
        isOpen={dialog === "addExercise"}
        onOpenChange={close}
        goal={goal}
      />
      <DeleteDialog
        isOpen={dialog === "delete"}
        onOpenChange={close}
        title={t(($) => $.disciplines.deleteDialog.goalTitle, {
          name: goal.name,
        })}
        body={t(($) => $.disciplines.deleteDialog.goalBody)}
        affectedDogCount={goal.dogs.length}
        isPending={remove.isPending}
        isError={remove.isError}
        onConfirm={() =>
          remove.mutate(goal.id, { onSuccess: () => setDialog(null) })
        }
      />
    </article>
  );
}
