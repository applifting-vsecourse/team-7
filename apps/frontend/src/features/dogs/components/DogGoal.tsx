import { useState } from "react";
import type { DogGoalAssignment } from "../api/dogProfileQueryOptions";
import {
  ChevronRight,
  Circle,
  CircleCheck,
  EllipsisVertical,
  Flag,
  Plus,
} from "@gravity-ui/icons";
import { Button, Chip, Dropdown, Label, Modal, Separator } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { pluralForm } from "@/lib/plural";
import { cn } from "@/lib/utils";

import type {
  Exercise,
  Goal,
} from "@/features/disciplines/api/disciplinesQueryOptions";

export type GoalAction =
  | {
      type: "assignGoal" | "removeGoal" | "complete" | "reopen";
      goalId: string;
    }
  | {
      type: "assignExercise" | "removeExercise";
      goalId: string;
      exerciseId: string;
    };

export function DogGoal({
  goal,
  assignment,
  isPending,
  onAction,
  onAddExercise,
  onRemove,
}: {
  goal: Goal;
  assignment?: DogGoalAssignment;
  isPending: boolean;
  onAction: (action: GoalAction) => void;
  onAddExercise: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const completed = Boolean(assignment?.completedAt);
  return (
    <>
      <article
        className={cn(
          "flex flex-col gap-3 rounded-2xl p-4",
          !assignment
            ? "border border-dashed border-muted bg-surface"
            : completed
              ? "bg-event-tile-success"
              : "bg-background",
        )}
      >
        <div className="flex flex-wrap items-start gap-3">
          {completed ? (
            <CircleCheck
              className="mt-1 size-5 shrink-0 text-success"
              aria-hidden="true"
            />
          ) : (
            <Flag
              className={cn(
                "mt-1 size-5 shrink-0",
                assignment ? "text-warning" : "text-muted",
              )}
              aria-hidden="true"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                "text-base leading-6 font-medium tracking-tight wrap-break-word",
                !assignment && "text-muted",
              )}
            >
              {goal.name}
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted">
              {t(
                ($) =>
                  $.disciplines.exerciseCount[
                    pluralForm(goal.exercises.length)
                  ],
                { count: goal.exercises.length },
              )}
            </p>
          </div>
          {!assignment ? (
            <Button
              variant="outline"
              size="sm"
              isDisabled={isPending}
              onPress={() => onAction({ type: "assignGoal", goalId: goal.id })}
            >
              <Plus className="size-4" aria-hidden="true" />
              {t(($) => $.dogProfile.assignGoal)}
            </Button>
          ) : (
            <>
              {completed ? (
                <Chip color="success" size="sm">
                  <CircleCheck className="size-3" aria-hidden="true" />
                  <Chip.Label>{t(($) => $.dogProfile.done)}</Chip.Label>
                </Chip>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  isDisabled={isPending}
                  onPress={() =>
                    onAction({ type: "complete", goalId: goal.id })
                  }
                >
                  <CircleCheck className="size-4" aria-hidden="true" />
                  {t(($) => $.dogProfile.markComplete)}
                </Button>
              )}
              <Dropdown>
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  aria-label={t(($) => $.disciplines.goalActions, {
                    name: goal.name,
                  })}
                  isDisabled={isPending}
                >
                  <EllipsisVertical className="size-4" aria-hidden="true" />
                </Button>
                <Dropdown.Popover placement="bottom end">
                  <Dropdown.Menu
                    onAction={(key) => {
                      if (key === "remove") onRemove();
                      else if (key === "add") onAddExercise();
                      else onAction({ type: "reopen", goalId: goal.id });
                    }}
                  >
                    {completed && (
                      <Dropdown.Item
                        id="reopen"
                        textValue={t(($) => $.dogProfile.reopen)}
                      >
                        <Label>{t(($) => $.dogProfile.reopen)}</Label>
                      </Dropdown.Item>
                    )}
                    <Dropdown.Item
                      id="add"
                      textValue={t(($) => $.disciplines.addExercise)}
                    >
                      <Label>{t(($) => $.disciplines.addExercise)}</Label>
                    </Dropdown.Item>
                    <Dropdown.Item
                      id="remove"
                      variant="danger"
                      textValue={t(($) => $.dogProfile.removeGoal)}
                    >
                      <Label>{t(($) => $.dogProfile.removeGoal)}</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </>
          )}
        </div>
        {assignment && (
          <>
            <Separator />
            {goal.exercises.length === 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">
                  {t(($) => $.dogProfile.noExercises)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  isDisabled={isPending}
                  onPress={onAddExercise}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  {t(($) => $.disciplines.addExercise)}
                </Button>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {goal.exercises.map((item) => {
                const selected = assignment.exercises.some(
                  (selected) => selected.exerciseId === item.id,
                );
                return (
                  <div key={item.id} className="flex items-center gap-2 py-2">
                    <Circle
                      className="size-4 shrink-0 text-muted"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm leading-6 wrap-break-word",
                          !selected && "text-muted",
                        )}
                      >
                        {item.name}
                      </p>
                      <p className="text-xs leading-5 text-muted">
                        {selected
                          ? t(($) => $.dogProfile.noTraining)
                          : t(($) => $.dogProfile.unassigned)}
                      </p>
                    </div>
                    {selected ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        isIconOnly
                        aria-label={t(($) => $.dogProfile.exerciseDetail, {
                          name: item.name,
                        })}
                        onPress={() => setExercise(item)}
                      >
                        <ChevronRight
                          className="size-4 text-accent"
                          aria-hidden="true"
                        />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        isDisabled={isPending}
                        onPress={() =>
                          onAction({
                            type: "assignExercise",
                            goalId: goal.id,
                            exerciseId: item.id,
                          })
                        }
                      >
                        <Plus className="size-4" aria-hidden="true" />
                        {t(($) => $.dogProfile.assign)}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </article>
      <Modal.Backdrop
        isOpen={Boolean(exercise)}
        onOpenChange={(open) => {
          if (!open) setExercise(null);
        }}
      >
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{exercise?.name}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              {exercise?.procedure && (
                <p className="text-sm leading-6 whitespace-pre-wrap">
                  {exercise.procedure}
                </p>
              )}
              <p className="text-sm text-muted">
                {t(($) => $.dogProfile.noTrainingHistory)}
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="danger-soft"
                isDisabled={isPending}
                onPress={() => {
                  if (exercise) {
                    onAction({
                      type: "removeExercise",
                      goalId: goal.id,
                      exerciseId: exercise.id,
                    });
                  }
                  setExercise(null);
                }}
              >
                {t(($) => $.dogProfile.removeExercise)}
              </Button>
              <Button variant="secondary" onPress={() => setExercise(null)}>
                {t(($) => $.dogProfile.close)}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
