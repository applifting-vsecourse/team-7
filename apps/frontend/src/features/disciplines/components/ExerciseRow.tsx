import type { Exercise } from "../api/disciplinesQueryOptions";
import { Circle, Grip } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { GridListItem } from "react-aria-components";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { ItemMenu } from "./ItemMenu";

/**
 * An exercise in its goal's reorderable list (ExerciseList). Its dialogs live
 * in the list: events from a portalled dialog bubble through the React tree
 * and would reach the row's drag and grid handlers.
 */
export function ExerciseRow({
  exercise,
  isReorderable,
  onEdit,
  onDelete,
}: {
  exercise: Exercise;
  // A single exercise has nothing to swap places with.
  isReorderable: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <GridListItem
      id={exercise.id}
      textValue={exercise.name}
      className={({ isDragging, isFocusVisible }) =>
        cn(
          "flex items-start gap-3 rounded-xl py-2 state-dim outline-none",
          isDragging && "opacity-50",
          isFocusVisible && "focus-ring",
        )
      }
    >
      {isReorderable ? (
        // Pointer users drag the row; keyboard and screen reader users
        // focus this handle, press Enter, move with arrows and drop.
        <Button
          slot="drag"
          isIconOnly
          variant="ghost"
          size="sm"
          className="cursor-grab"
          aria-label={t(($) => $.disciplines.moveExercise, {
            name: exercise.name,
          })}
        >
          <Grip className="size-4 text-muted" aria-hidden="true" />
        </Button>
      ) : (
        <Circle
          className="mt-1 size-4 shrink-0 text-muted"
          aria-hidden="true"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm leading-6 font-medium">{exercise.name}</p>
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
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </GridListItem>
  );
}
