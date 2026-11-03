import { useId } from "react";
import type { DogGoalAssignment } from "../api/dogProfileQueryOptions";
import {
  ChevronRight,
  Circle,
  CircleCheck,
  EllipsisVertical,
  Flag,
  Plus,
} from "@gravity-ui/icons";
import { Button, Chip, Dropdown, Label, Separator } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { pluralForm } from "@/lib/plural";
import { cn } from "@/lib/utils";

import type { Goal } from "@/features/disciplines/api/disciplinesQueryOptions";

import { LastTraining } from "./LastTraining";

export type GoalAction =
  | {
      type: "assignGoal" | "removeGoal" | "complete" | "reopen";
      goalId: string;
    }
  | {
      type: "assignExercise";
      goalId: string;
      exerciseId: string;
    };

export function DogGoal({
  dogId,
  goal,
  assignment,
  lastTrainingByExercise,
  isPending,
  onAction,
  onAddExercise,
  onRemove,
}: {
  dogId: string;
  goal: Goal;
  assignment?: DogGoalAssignment;
  lastTrainingByExercise: ReadonlyMap<string, string>;
  isPending: boolean;
  onAction: (action: GoalAction) => void;
  onAddExercise: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const rowId = useId();
  const completed = Boolean(assignment?.completedAt);
  return (
    <>
      <article
        className={cn(
          "flex flex-col gap-3 rounded-2xl p-4",
          !assignment
            ? "border border-dashed border-muted bg-surface"
            : completed
              ? "bg-event-tile-success shadow-surface"
              : "bg-background shadow-surface",
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
          {/* min-w-50 (200px) as in Figma: the menu stays beside the text
              until the text would get narrower than that. */}
          <div className="min-w-50 flex-1">
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
            {completed && (
              <Chip
                color="success"
                variant="primary"
                size="sm"
                className="mt-1"
              >
                <CircleCheck className="size-3" aria-hidden="true" />
                <Chip.Label>{t(($) => $.dogProfile.done)}</Chip.Label>
              </Chip>
            )}
          </div>
          <div
            className={cn(
              "flex items-center gap-3",
              // The done chip lives in the text column, so a completed goal
              // only has its menu here and keeps it on the title row.
              !completed && "w-full sm:w-auto",
            )}
          >
            {!assignment ? (
              <Button
                variant="outline"
                size="sm"
                isDisabled={isPending}
                onPress={() =>
                  onAction({ type: "assignGoal", goalId: goal.id })
                }
              >
                <Plus className="size-4" aria-hidden="true" />
                {t(($) => $.dogProfile.assignGoal)}
              </Button>
            ) : (
              <>
                {!completed && (
                  <Button
                    variant="secondary"
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
            {/* Same layout as ExerciseRow in the discipline library. Rows have
                py-1 so the hover background has room; gap-2 + 2 × py-1 keeps
                the library's 16px rhythm, and -mx-2/px-2 keeps the text on
                the card's content edge. */}
            <ul className="-mx-2 flex flex-col gap-2">
              {goal.exercises.map((item) => {
                const selected = assignment.exercises.some(
                  (selected) => selected.exerciseId === item.id,
                );
                const nameId = `${rowId}-${item.id}-name`;
                const metaId = `${rowId}-${item.id}-meta`;
                const content = (
                  <>
                    <Circle
                      className="mt-1 size-4 shrink-0 text-muted"
                      aria-hidden="true"
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span
                        id={nameId}
                        className={cn(
                          "text-sm leading-6 font-medium wrap-break-word",
                          !selected && "text-muted",
                        )}
                      >
                        {item.name}
                      </span>
                      <span
                        id={metaId}
                        className="text-xs leading-5 text-muted"
                      >
                        {selected ? (
                          <LastTraining
                            date={lastTrainingByExercise.get(item.id) ?? null}
                          />
                        ) : (
                          t(($) => $.dogProfile.unassigned)
                        )}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={item.id}>
                    {selected ? (
                      <Link
                        to="/dogs/$dogId/exercises/$exerciseId"
                        params={{ dogId, exerciseId: item.id }}
                        aria-labelledby={nameId}
                        aria-describedby={metaId}
                        className="flex items-start gap-3 rounded-2xl px-2 py-1 transition-colors outline-none hover:bg-default focus-visible:focus-ring"
                      >
                        {content}
                        <ChevronRight
                          className="mt-1 size-4 shrink-0 text-accent"
                          aria-hidden="true"
                        />
                      </Link>
                    ) : (
                      <div className="flex items-start gap-3 px-2 py-1">
                        {content}
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
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </article>
    </>
  );
}
