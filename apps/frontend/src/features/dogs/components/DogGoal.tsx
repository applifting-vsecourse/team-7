import { useId } from "react";
import type { DogGoalAssignment } from "../api/dogProfileQueryOptions";
import type { GoalStatus } from "../schemas/statusSchema";
import {
  ArrowRotateLeft,
  ChevronRight,
  Circle,
  CircleCheck,
  CirclePause,
  Flag,
  Plus,
  TrashBin,
} from "@gravity-ui/icons";
import { Button, Chip, Separator } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { pluralForm } from "@/lib/plural";
import { cn } from "@/lib/utils";

import type { Goal } from "@/features/disciplines/api/disciplinesQueryOptions";

import { displayedExerciseStatus } from "../lib/exerciseStatus";
import { ActionsMenu, type MenuAction } from "./ActionsMenu";
import { LastTraining } from "./LastTraining";

export type GoalAction =
  | {
      type: "assignGoal" | "removeGoal";
      goalId: string;
    }
  | {
      type: "assignExercise";
      goalId: string;
      exerciseId: string;
    };

export function DogGoal({
  dogId,
  dogName,
  goal,
  assignment,
  lastTrainingByExercise,
  isPending,
  onAction,
  onStatus,
  onAddExercise,
  onRemove,
  readOnly = false,
}: {
  dogId: string;
  dogName: string;
  goal: Goal;
  assignment?: DogGoalAssignment;
  lastTrainingByExercise: ReadonlyMap<string, string>;
  isPending: boolean;
  onAction: (action: GoalAction) => void;
  onStatus: (status: GoalStatus) => void;
  onAddExercise: () => void;
  onRemove: () => void;
  /** An archived dog's goals open, but nothing can be changed. */
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  const rowId = useId();
  const status = assignment?.status;
  const completed = status === "completed";
  const paused = status === "paused";
  // Own exercise statuses: pausing the goal does not change them (Figma S6).
  const counts = { paused: 0, mastered: 0 };
  for (const exercise of assignment?.exercises ?? []) {
    if (exercise.status !== "in_progress") counts[exercise.status] += 1;
  }
  const summary = [
    t(($) => $.disciplines.exerciseCount[pluralForm(goal.exercises.length)], {
      count: goal.exercises.length,
    }),
  ];
  if (counts.paused) {
    summary.push(
      t(($) => $.status.pausedCount[pluralForm(counts.paused)], {
        count: counts.paused,
      }),
    );
  }
  if (counts.mastered) {
    summary.push(
      t(($) => $.status.masteredCount[pluralForm(counts.mastered)], {
        count: counts.mastered,
      }),
    );
  }
  // Figma S1 608:15075 (in progress) and S3 608:26363 (paused); a completed
  // goal can be returned to in progress or paused.
  const pause: MenuAction = {
    id: "paused",
    icon: CirclePause,
    label: t(($) => $.status.pauseGoal),
    hint: t(($) => $.status.pauseHint),
  };
  const resume: MenuAction = {
    id: "in_progress",
    icon: ArrowRotateLeft,
    label: t(($) => $.status.resume),
    hint: t(($) => $.status.resumeGoalHint),
  };
  const complete: MenuAction = {
    id: "completed",
    icon: CircleCheck,
    label: t(($) => $.dogProfile.markComplete),
  };
  const menu: MenuAction[] = [
    ...(paused ? [resume, complete] : completed ? [resume, pause] : [pause]),
    { id: "add", icon: Plus, label: t(($) => $.disciplines.addExercise) },
    {
      id: "remove",
      icon: TrashBin,
      label: t(($) => $.dogProfile.removeGoal),
      hint: t(($) => $.status.removeGoalHint, { name: dogName }),
      danger: true,
    },
  ];
  return (
    <>
      <article
        aria-label={goal.name}
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
          ) : paused ? (
            <CirclePause
              className="mt-1 size-5 shrink-0 text-muted"
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
                "text-base leading-6 font-medium tracking-tight",
                !assignment && "text-muted",
              )}
            >
              {goal.name}
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted">
              {summary.join(" · ")}
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
            {paused && (
              // Figma S2 608:15161: grey "Pozastaveno" chip.
              <Chip size="sm" className="mt-1">
                <CirclePause className="size-3" aria-hidden="true" />
                <Chip.Label>{t(($) => $.status.paused)}</Chip.Label>
              </Chip>
            )}
          </div>
          {!readOnly && (
            <div
              className={cn(
                "flex items-center gap-3",
                // The status chip lives in the text column, so a completed or
                // paused goal only has its menu here and keeps it on the title row.
                status === "in_progress" && "w-full sm:w-auto",
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
                  {status === "in_progress" && (
                    <Button
                      variant="secondary"
                      isDisabled={isPending}
                      onPress={() => onStatus("completed")}
                    >
                      <CircleCheck className="size-4" aria-hidden="true" />
                      {t(($) => $.dogProfile.markComplete)}
                    </Button>
                  )}
                  <ActionsMenu
                    label={t(($) => $.disciplines.goalActions, {
                      name: goal.name,
                    })}
                    actions={menu}
                    isDisabled={isPending}
                    onAction={(key) => {
                      if (key === "remove") onRemove();
                      else if (key === "add") onAddExercise();
                      else onStatus(key as GoalStatus);
                    }}
                  />
                </>
              )}
            </div>
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
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    data-tour="add-exercise"
                    isDisabled={isPending}
                    onPress={onAddExercise}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    {t(($) => $.disciplines.addExercise)}
                  </Button>
                )}
              </div>
            )}
            {/* Same layout as ExerciseRow in the discipline library. Rows have
                py-1 so the hover background has room; gap-2 + 2 × py-1 keeps
                the library's 16px rhythm, and -mx-2/px-2 keeps the text on
                the card's content edge. */}
            <ul className="-mx-2 flex flex-col gap-2">
              {goal.exercises.map((item) => {
                const selected = assignment.exercises.find(
                  (selected) => selected.exerciseId === item.id,
                );
                // Figma S6: state by icon and text, never by colour alone.
                const shown =
                  selected &&
                  displayedExerciseStatus(assignment.status, selected.status);
                const StatusIcon =
                  shown === "paused"
                    ? CirclePause
                    : shown === "mastered"
                      ? CircleCheck
                      : Circle;
                const nameId = `${rowId}-${item.id}-name`;
                const metaId = `${rowId}-${item.id}-meta`;
                const content = (
                  <>
                    <StatusIcon
                      className={cn(
                        "mt-1 size-4 shrink-0",
                        shown === "mastered" ? "text-success" : "text-muted",
                      )}
                      aria-hidden="true"
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span
                        id={nameId}
                        className={cn(
                          "text-sm leading-6 font-medium",
                          (!selected || shown === "paused") && "text-muted",
                        )}
                      >
                        {item.name}
                      </span>
                      <span
                        id={metaId}
                        className="text-xs leading-5 text-muted"
                      >
                        {selected ? (
                          <>
                            {shown === "paused" &&
                              `${t(($) => $.status.paused)} · `}
                            {shown === "mastered" &&
                              `${t(($) => $.status.mastered)} · `}
                            <LastTraining
                              date={lastTrainingByExercise.get(item.id) ?? null}
                            />
                          </>
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
                        {!readOnly && (
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
