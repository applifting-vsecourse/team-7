import type { ReactNode } from "react";
import type { DogRef, Exercise, Goal } from "../api/disciplinesQueryOptions";
import { ChartLine, Flag } from "@gravity-ui/icons";
import { Alert, toast } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";

import {
  useSaveDiscipline,
  useSaveExercise,
  useSaveGoal,
} from "../hooks/useLibraryMutations";
import { LibraryItemDialog } from "./LibraryItemDialog";

type DialogState = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

function ContextLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <p className="flex min-w-0 items-center gap-1.5 text-sm">
      {icon}
      <span className="text-muted">{label}</span>
      <span className="min-w-0 font-medium wrap-break-word text-foreground">
        {value}
      </span>
    </p>
  );
}

/** "Nová disciplína" / "Upravit disciplínu". A new discipline opens its detail. */
export function DisciplineDialog({
  discipline,
  ...state
}: DialogState & {
  discipline?: { id: string; name: string; description: string | null };
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const save = useSaveDiscipline();

  return (
    <LibraryItemDialog
      {...state}
      title={
        discipline
          ? t(($) => $.disciplines.disciplineForm.editTitle)
          : t(($) => $.disciplines.disciplineForm.createTitle)
      }
      description={
        discipline
          ? undefined
          : t(($) => $.disciplines.disciplineForm.description)
      }
      labels={{
        name: t(($) => $.disciplines.disciplineForm.name),
        namePlaceholder: t(($) => $.disciplines.disciplineForm.namePlaceholder),
        text: t(($) => $.disciplines.disciplineForm.text),
        textPlaceholder: t(($) => $.disciplines.disciplineForm.textPlaceholder),
      }}
      submitLabel={
        discipline
          ? t(($) => $.disciplines.save)
          : t(($) => $.disciplines.disciplineForm.submit)
      }
      defaultValues={
        discipline && {
          name: discipline.name,
          text: discipline.description ?? "",
        }
      }
      isPending={save.isPending}
      onSubmit={async (values) => {
        const saved = await save.mutateAsync({ id: discipline?.id, values });
        state.onOpenChange(false);
        if (!discipline) {
          // The dialog closes and the page changes, so confirm what happened.
          toast.success(
            t(($) => $.disciplines.createdToast, { name: values.name }),
          );
          await navigate({
            to: ROUTES.discipline,
            params: { disciplineId: saved.id },
          });
        }
      }}
    />
  );
}

export function GoalDialog({
  discipline,
  goal,
  ...state
}: DialogState & {
  discipline: { id: string; name: string };
  goal?: Pick<Goal, "id" | "name" | "criterion">;
}) {
  const { t } = useTranslation();
  const save = useSaveGoal();

  return (
    <LibraryItemDialog
      {...state}
      title={
        goal
          ? t(($) => $.disciplines.goalForm.editTitle)
          : t(($) => $.disciplines.goalForm.createTitle)
      }
      context={
        <ContextLine
          icon={
            <ChartLine
              className="size-4 shrink-0 text-accent"
              aria-hidden="true"
            />
          }
          label={t(($) => $.disciplines.goalForm.context)}
          value={discipline.name}
        />
      }
      labels={{
        name: t(($) => $.disciplines.goalForm.name),
        namePlaceholder: t(($) => $.disciplines.goalForm.namePlaceholder),
        text: t(($) => $.disciplines.goalForm.text),
        textPlaceholder: t(($) => $.disciplines.goalForm.textPlaceholder),
      }}
      submitLabel={
        goal
          ? t(($) => $.disciplines.save)
          : t(($) => $.disciplines.goalForm.submit)
      }
      defaultValues={goal && { name: goal.name, text: goal.criterion ?? "" }}
      isPending={save.isPending}
      onSubmit={async (values) => {
        await save.mutateAsync({
          disciplineId: discipline.id,
          id: goal?.id,
          values,
        });
        state.onOpenChange(false);
      }}
    />
  );
}

function useDogNames(dogs: DogRef[]) {
  const { i18n } = useTranslation();
  return new Intl.ListFormat(i18n.resolvedLanguage ?? "cs", {
    type: "conjunction",
  }).format(dogs.map((dog) => dog.text));
}

export function ExerciseDialog({
  goal,
  exercise,
  ...state
}: DialogState & {
  goal: Goal;
  exercise?: Exercise;
}) {
  const { t } = useTranslation();
  const save = useSaveExercise();
  const dogNames = useDogNames(goal.dogs);
  // Only new exercises: the dogs that have the goal won't get it on their own.
  const showNotice = !exercise && goal.dogs.length > 0;

  return (
    <LibraryItemDialog
      {...state}
      title={
        exercise
          ? t(($) => $.disciplines.exerciseForm.editTitle)
          : t(($) => $.disciplines.exerciseForm.createTitle)
      }
      context={
        <ContextLine
          icon={
            <Flag className="size-4 shrink-0 text-warning" aria-hidden="true" />
          }
          label={t(($) => $.disciplines.exerciseForm.context)}
          value={goal.name}
        />
      }
      notice={
        showNotice ? (
          <Alert status="accent">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>
                {t(($) => $.disciplines.exerciseForm.noticeTitle)}
              </Alert.Title>
              <Alert.Description>
                {goal.dogs.length === 1
                  ? t(($) => $.disciplines.exerciseForm.noticeDescriptionOne, {
                      dogs: dogNames,
                      goal: goal.name,
                    })
                  : t(($) => $.disciplines.exerciseForm.noticeDescription, {
                      dogs: dogNames,
                      goal: goal.name,
                    })}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null
      }
      labels={{
        name: t(($) => $.disciplines.exerciseForm.name),
        namePlaceholder: t(($) => $.disciplines.exerciseForm.namePlaceholder),
        text: t(($) => $.disciplines.exerciseForm.text),
        textPlaceholder: t(($) => $.disciplines.exerciseForm.textPlaceholder),
      }}
      submitLabel={
        exercise
          ? t(($) => $.disciplines.save)
          : t(($) => $.disciplines.exerciseForm.submit)
      }
      defaultValues={
        exercise && { name: exercise.name, text: exercise.procedure ?? "" }
      }
      isPending={save.isPending}
      onSubmit={async (values) => {
        await save.mutateAsync({ goalId: goal.id, id: exercise?.id, values });
        state.onOpenChange(false);
      }}
    />
  );
}
