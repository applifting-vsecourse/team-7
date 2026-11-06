import { useState } from "react";
import type { Exercise, Goal } from "../api/disciplinesQueryOptions";
import { Alert, Button } from "@heroui/react";
import { HTTPError } from "ky";
import { DropIndicator, GridList, useDragAndDrop } from "react-aria-components";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { useDialogState } from "../hooks/useDialogState";
import {
  useDeleteExercise,
  useReorderExercises,
} from "../hooks/useLibraryMutations";
import { moveIds, sortByIds } from "../lib/exerciseOrder";
import { DeleteDialog } from "./DeleteDialog";
import { ExerciseRow } from "./ExerciseRow";
import { ExerciseDialog } from "./LibraryDialogs";

const isStaleOrder = (error: unknown) =>
  error instanceof HTTPError && error.response.status === 409;

/**
 * A goal's exercises in the handler's order (#73), reordered by dragging a
 * row or, from the keyboard, its handle. The order is purely visual.
 */
export function ExerciseList({ goal }: { goal: Goal }) {
  const { t } = useTranslation();
  const reorder = useReorderExercises();
  const remove = useDeleteExercise();
  const { dialog, open, close, onOpenChange } = useDialogState<
    "edit" | "delete"
  >();
  // Kept after closing so the dialog keeps its content while it animates out.
  const [selected, setSelected] = useState<Exercise>();
  // The new order shows at once; on failure the cached one comes back.
  const exercises = reorder.isPending
    ? sortByIds(goal.exercises, reorder.variables.exerciseIds)
    : goal.exercises;
  // A single exercise has nothing to swap places with.
  const isReorderable = exercises.length > 1;

  // The hooks stay attached: GridList can't gain or lose them between renders.
  // Paused while an order saves: overlapping saves could finish out of order.
  const { dragAndDropHooks } = useDragAndDrop({
    isDisabled: !isReorderable || reorder.isPending,
    getItems: (keys) =>
      exercises
        .filter((exercise) => keys.has(exercise.id))
        .map((exercise) => ({ "text/plain": exercise.name })),
    onReorder: ({ keys, target }) => {
      const ids = exercises.map((exercise) => exercise.id);
      reorder.mutate({
        goalId: goal.id,
        exerciseIds: moveIds(
          ids,
          new Set([...keys].map(String)),
          String(target.key),
          target.dropPosition === "after" ? "after" : "before",
        ),
      });
    },
    renderDropIndicator: (target) => (
      <DropIndicator
        target={target}
        className={({ isDropTarget }) =>
          cn("-my-px h-0.5 rounded-full", isDropTarget && "bg-accent")
        }
      />
    ),
  });

  const dialogs = selected ? (
    <>
      <ExerciseDialog
        isOpen={dialog === "edit"}
        onOpenChange={onOpenChange}
        goal={goal}
        exercise={selected}
      />
      <DeleteDialog
        isOpen={dialog === "delete"}
        onOpenChange={onOpenChange}
        title={t(($) => $.disciplines.deleteDialog.exerciseTitle, {
          name: selected.name,
        })}
        body={t(($) => $.disciplines.deleteDialog.exerciseBody)}
        affectedDogCount={selected.dogCount}
        isPending={remove.isPending}
        isError={remove.isError}
        onConfirm={() => remove.mutate(selected.id, { onSuccess: close })}
      />
    </>
  ) : null;

  if (exercises.length === 0) {
    return (
      <>
        <Alert status="warning" className="animate-enter">
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
        {dialogs}
      </>
    );
  }

  return (
    <>
      {/* Rows carry the spacing (py-2) so the drop indicators between them
          don't add gaps while dragging. */}
      <GridList
        aria-label={t(($) => $.disciplines.goalExercises, { name: goal.name })}
        dragAndDropHooks={dragAndDropHooks}
        className="-my-2 flex flex-col"
      >
        {/* Static children rather than `items`: GridList caches rendered
            items by object, which would miss changes to the goal. */}
        {exercises.map((exercise) => (
          <ExerciseRow
            key={exercise.id}
            exercise={exercise}
            isReorderable={isReorderable}
            onEdit={() => {
              setSelected(exercise);
              open("edit");
            }}
            onDelete={() => {
              setSelected(exercise);
              remove.reset();
              open("delete");
            }}
          />
        ))}
      </GridList>
      {reorder.isError ? (
        <Alert status="danger" className="animate-enter">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>
              {isStaleOrder(reorder.error)
                ? t(($) => $.disciplines.reorderStale)
                : t(($) => $.disciplines.reorderError)}
            </Alert.Title>
          </Alert.Content>
          {isStaleOrder(reorder.error) ? null : (
            <Button
              variant="secondary"
              size="sm"
              onPress={() => reorder.mutate(reorder.variables)}
            >
              {t(($) => $.disciplines.retry)}
            </Button>
          )}
        </Alert>
      ) : null}
      {dialogs}
    </>
  );
}
