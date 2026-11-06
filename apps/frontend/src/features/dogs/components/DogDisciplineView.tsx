import { useState } from "react";
import type { GoalStatus } from "../schemas/statusSchema";
import {
  CircleCheck,
  EllipsisVertical,
  ListUl,
  Plus,
  Star,
} from "@gravity-ui/icons";
import { Button, Dropdown, Label } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api-client";
import { pluralForm } from "@/lib/plural";
import { transitionName } from "@/lib/utils";

import { useSession } from "@/features/auth/hooks/useSession";
import { disciplineQueryOptions } from "@/features/disciplines/api/disciplinesQueryOptions";
import { DeleteDialog } from "@/features/disciplines/components/DeleteDialog";
import { LibraryItemDialog } from "@/features/disciplines/components/LibraryItemDialog";
import type { LibraryItemValues } from "@/features/disciplines/schemas/libraryItemSchema";

import {
  dogDisciplinePath,
  dogSelectionQueryOptions,
  type DogProfile,
} from "../api/dogProfileQueryOptions";
import { useDogProfileMutation } from "../hooks/useDogProfileMutation";
import { useStatusMutation } from "../hooks/useStatusMutation";
import { AverageRating } from "./AverageRating";
import { DogGoal, type GoalAction } from "./DogGoal";
import { DogStat } from "./DogStat";
import { DoneSection } from "./DoneSection";
import { QueryFeedback } from "./QueryFeedback";

export function DogDisciplineView({
  dog,
  disciplineId,
}: {
  dog: DogProfile;
  disciplineId: string;
}) {
  const { t } = useTranslation();
  const { user } = useSession();
  const navigate = useNavigate();
  const library = useQuery(disciplineQueryOptions(user?.id, disciplineId));
  const selection = useQuery(
    dogSelectionQueryOptions(user?.id, dog.id, disciplineId),
  );
  const [creating, setCreating] = useState<
    { type: "goal" } | { type: "exercise"; goalId: string } | null
  >(null);
  const [removing, setRemoving] = useState<
    { type: "discipline" } | { type: "goal"; goalId: string } | null
  >(null);
  const setStatus = useStatusMutation(dog.id);
  const base = dogDisciplinePath(dog.id, disciplineId);
  const mutate = useDogProfileMutation(
    async (action: GoalAction | { type: "removeDiscipline" }) => {
      if (action.type === "removeDiscipline") return api.delete(base);
      const goalPath = `${base}/goals/${encodeURIComponent(action.goalId)}`;
      if (action.type === "removeGoal") return api.delete(goalPath);
      if (action.type === "assignGoal") {
        return api.post(`${base}/goals`, {
          json: {
            goalId: action.goalId,
            exerciseIds:
              library.data?.goals
                .find((goal) => goal.id === action.goalId)
                ?.exercises.map((item) => item.id) ?? [],
          },
        });
      }
      if (action.type === "assignExercise") {
        return api.post(`${goalPath}/exercises`, {
          json: { exerciseId: action.exerciseId },
        });
      }
    },
  );
  const create = useDogProfileMutation((values: LibraryItemValues) => {
    if (creating?.type === "exercise") {
      return api.post(
        `${base}/goals/${encodeURIComponent(creating.goalId)}/library-exercises`,
        { json: { name: values.name, procedure: values.text } },
      );
    }
    return api.post(`${base}/library-goals`, {
      json: { name: values.name, criterion: values.text },
    });
  });
  if (!library.data || !selection.data) {
    return (
      <>
        <QueryFeedback query={library} />
        <QueryFeedback query={selection} />
      </>
    );
  }
  const discipline = library.data;
  const dogDiscipline = dog.disciplines.find(
    (item) => item.id === disciplineId,
  );
  const averageRating = dogDiscipline?.averageRating ?? null;
  const lastTrainingByExercise = new Map(
    dogDiscipline?.exerciseTraining.map((item) => [
      item.exerciseId,
      item.lastTrainingAt,
    ]),
  );
  const assignments = selection.data.goals;
  const withStatus = (status: GoalStatus) =>
    discipline.goals.filter((goal) =>
      assignments.some(
        (item) => item.goalId === goal.id && item.status === status,
      ),
    );
  const active = withStatus("in_progress");
  const paused = withStatus("paused");
  const done = withStatus("completed");
  const unassigned = discipline.goals.filter(
    (goal) => !assignments.some((item) => item.goalId === goal.id),
  );
  const exerciseCount = assignments.reduce(
    (count, goal) => count + goal.exercises.length,
    0,
  );
  const archived = Boolean(dog.archivedAt);
  const goalCard = (goal: (typeof discipline.goals)[number]) => (
    <DogGoal
      key={goal.id}
      readOnly={archived}
      dogId={dog.id}
      dogName={dog.name}
      goal={goal}
      assignment={assignments.find((item) => item.goalId === goal.id)}
      lastTrainingByExercise={lastTrainingByExercise}
      isPending={mutate.isPending || setStatus.isPending}
      onAction={(action) => mutate.mutate(action)}
      onStatus={(status) =>
        setStatus.mutate({
          kind: "goal",
          disciplineId,
          goalId: goal.id,
          name: goal.name,
          status,
        })
      }
      onAddExercise={() => setCreating({ type: "exercise", goalId: goal.id })}
      onRemove={() => {
        mutate.reset();
        setRemoving({ type: "goal", goalId: goal.id });
      }}
    />
  );
  return (
    <>
      <nav
        aria-label={t(($) => $.disciplines.breadcrumbs)}
        className="flex min-w-0 items-center gap-2 text-sm"
      >
        <Link
          to="/dogs/$dogId"
          params={{ dogId: dog.id }}
          className="max-w-breadcrumb-item truncate text-muted hover:text-foreground"
        >
          {dog.name}
        </Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page" className="min-w-0 truncate">
          {discipline.name}
        </span>
      </nav>
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-4">
          <h1
            id="dog-discipline-heading"
            className="min-w-0 flex-1 text-3xl leading-9 font-semibold tracking-tight"
          >
            <span
              className="inline-block"
              style={transitionName("discipline", discipline.id)}
            >
              {discipline.name}
            </span>
          </h1>
          {!archived && (
            <Dropdown>
              <Button
                isIconOnly
                variant="secondary"
                aria-label={t(($) => $.disciplines.actions)}
              >
                <EllipsisVertical className="size-4" aria-hidden="true" />
              </Button>
              <Dropdown.Popover placement="bottom end" className="min-w-60">
                <Dropdown.Menu
                  onAction={() => {
                    mutate.reset();
                    setRemoving({ type: "discipline" });
                  }}
                >
                  <Dropdown.Item
                    id="remove"
                    variant="danger"
                    textValue={t(($) => $.dogProfile.removeDiscipline)}
                  >
                    <Label>{t(($) => $.dogProfile.removeDiscipline)}</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          )}
        </div>
        <p className="text-base leading-7 text-muted">
          {/* Figma S2: "…, 1 je pozastavený." */}
          {paused.length
            ? t(($) => $.status.disciplineSubtitle[pluralForm(paused.length)], {
                name: dog.name,
                // Paused and completed goals aren't being trained.
                selected: active.length,
                total: discipline.goals.length,
                count: paused.length,
              })
            : t(($) => $.dogProfile.disciplineSubtitle, {
                name: dog.name,
                selected: active.length,
                total: discipline.goals.length,
              })}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
        <DogStat
          icon={Star}
          value={
            <AverageRating
              rating={averageRating}
              emptyLabel={t(($) => $.dogProfile.noData)}
            />
          }
          label={t(($) => $.dogProfile.averageRatingPeriod)}
          tone="warning"
        />
        <DogStat
          icon={CircleCheck}
          value={t(($) => $.dogProfile.progress, {
            completed: done.length,
            total: assignments.length,
          })}
          label={t(($) => $.dogProfile.completedGoals)}
          tone="success"
        />
        <DogStat
          icon={ListUl}
          value={exerciseCount}
          label={t(($) => $.dogProfile.assignedExercises)}
        />
      </div>
      {mutate.isError && (
        <p role="alert" className="text-sm text-danger">
          {t(($) => $.disciplines.saveError)}
        </p>
      )}
      <section
        className="flex w-full max-w-200 flex-col gap-4"
        aria-labelledby="dog-goals-heading"
      >
        <div className="flex items-center justify-between gap-3">
          <h2
            id="dog-goals-heading"
            className="text-2xl leading-8 font-semibold tracking-tight"
          >
            {t(($) => $.disciplines.goals)}
          </h2>
          {!archived && (
            <Button
              variant="outline"
              onPress={() => setCreating({ type: "goal" })}
            >
              <Plus className="size-4" aria-hidden="true" />
              {t(($) => $.disciplines.addGoal)}
            </Button>
          )}
        </div>
        {active.length ? (
          active.map(goalCard)
        ) : (
          <p className="text-sm text-muted">
            {paused.length
              ? t(($) => $.status.noActiveGoals)
              : t(($) => $.dogProfile.noActiveGoals)}
          </p>
        )}
      </section>
      {paused.length > 0 && (
        // Figma S2 608:22356: collapsible group between goals and unassigned.
        <div className="w-full max-w-200">
          <DoneSection
            title={t(($) => $.status.pausedGoals, { count: paused.length })}
          >
            <div className="flex flex-col gap-4">{paused.map(goalCard)}</div>
          </DoneSection>
        </div>
      )}
      {unassigned.length > 0 && !archived && (
        <div className="w-full max-w-200">
          <DoneSection
            title={t(($) => $.dogProfile.unassignedGoals, {
              count: unassigned.length,
            })}
          >
            <div className="flex flex-col gap-3">
              <p className="text-sm leading-6 text-muted">
                {t(($) => $.dogProfile.unassignedGoalsDescription, {
                  name: dog.name,
                })}
              </p>
              {unassigned.map(goalCard)}
            </div>
          </DoneSection>
        </div>
      )}
      {done.length > 0 && (
        <div className="w-full max-w-200">
          <DoneSection
            title={t(($) => $.dogProfile.doneGoals, { count: done.length })}
          >
            <div className="flex flex-col gap-4">{done.map(goalCard)}</div>
          </DoneSection>
        </div>
      )}
      {creating && (
        <LibraryItemDialog
          isOpen
          onOpenChange={(open) => {
            if (!open) setCreating(null);
          }}
          title={
            creating.type === "goal"
              ? t(($) => $.disciplines.goalForm.createTitle)
              : t(($) => $.disciplines.exerciseForm.createTitle)
          }
          labels={
            creating.type === "goal"
              ? {
                  name: t(($) => $.disciplines.goalForm.name),
                  namePlaceholder: t(
                    ($) => $.disciplines.goalForm.namePlaceholder,
                  ),
                  text: t(($) => $.disciplines.goalForm.text),
                  textPlaceholder: t(
                    ($) => $.disciplines.goalForm.textPlaceholder,
                  ),
                }
              : {
                  name: t(($) => $.disciplines.exerciseForm.name),
                  namePlaceholder: t(
                    ($) => $.disciplines.exerciseForm.namePlaceholder,
                  ),
                  text: t(($) => $.disciplines.exerciseForm.text),
                  textPlaceholder: t(
                    ($) => $.disciplines.exerciseForm.textPlaceholder,
                  ),
                }
          }
          submitLabel={t(($) => $.disciplines.save)}
          isPending={create.isPending}
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            setCreating(null);
          }}
        />
      )}
      {removing && (
        <DeleteDialog
          isOpen
          onOpenChange={(open) => {
            if (!open) setRemoving(null);
          }}
          title={
            removing.type === "discipline"
              ? t(($) => $.dogProfile.removeDiscipline)
              : t(($) => $.dogProfile.removeGoal)
          }
          body={t(($) => $.dogProfile.removeAssignmentDescription)}
          affectedDogCount={0}
          isPending={mutate.isPending}
          isError={mutate.isError}
          confirmLabel={t(($) => $.dogProfile.remove)}
          onConfirm={async () => {
            try {
              await mutate.mutateAsync(
                removing.type === "discipline"
                  ? { type: "removeDiscipline" }
                  : { type: "removeGoal", goalId: removing.goalId },
              );
              setRemoving(null);
              if (removing.type === "discipline") {
                await navigate({
                  to: "/dogs/$dogId",
                  params: { dogId: dog.id },
                });
              }
            } catch {
              /* Show error and allow retry. */
            }
          }}
        />
      )}
    </>
  );
}
