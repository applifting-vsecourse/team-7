import { useState } from "react";
import { CircleDashed, FileArrowUp, Plus } from "@gravity-ui/icons";
import { Breadcrumbs, Button, Separator } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import { HTTPError } from "@/lib/api-client";
import { pluralForm } from "@/lib/plural";

import { useSession } from "@/features/auth/hooks/useSession";

import {
  disciplineQueryOptions,
  type DisciplineDetail,
} from "../api/disciplinesQueryOptions";
import { useDeleteDiscipline } from "../hooks/useLibraryMutations";
import { DeleteDialog } from "./DeleteDialog";
import { DisciplineDogs } from "./DisciplineDogs";
import { EmptyState } from "./EmptyState";
import { GoalCard } from "./GoalCard";
import { ItemMenu } from "./ItemMenu";
import { DisciplineDialog, GoalDialog } from "./LibraryDialogs";

export function DisciplineDetailView({
  disciplineId,
}: {
  disciplineId: string;
}) {
  const { t } = useTranslation();
  const { user } = useSession();
  const { data, isPending, isError, error, refetch } = useQuery(
    disciplineQueryOptions(user?.id, disciplineId),
  );

  if (isPending) {
    return (
      <p role="status" className="text-sm text-muted">
        {t(($) => $.disciplines.detailLoading)}
      </p>
    );
  }

  if (isError) {
    const notFound =
      error instanceof HTTPError && error.response.status === 404;
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-sm text-danger">
          {notFound
            ? t(($) => $.disciplines.notFound)
            : t(($) => $.disciplines.detailLoadError)}
        </p>
        {notFound ? (
          <Link to={ROUTES.disciplines} className="text-sm text-accent">
            {t(($) => $.navigation.disciplines)}
          </Link>
        ) : (
          <Button variant="secondary" size="sm" onPress={() => void refetch()}>
            {t(($) => $.disciplines.retry)}
          </Button>
        )}
      </div>
    );
  }

  return <DisciplineContent discipline={data} />;
}

function DisciplineContent({ discipline }: { discipline: DisciplineDetail }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<"edit" | "delete" | "addGoal" | null>(
    null,
  );
  const remove = useDeleteDiscipline();
  const close = (open: boolean) => {
    if (!open) setDialog(null);
  };
  const exerciseCount = discipline.goals.reduce(
    (sum, goal) => sum + goal.exercises.length,
    0,
  );

  return (
    <>
      <Breadcrumbs aria-label={t(($) => $.disciplines.breadcrumbs)}>
        <Breadcrumbs.Item href={ROUTES.disciplines}>
          {t(($) => $.navigation.disciplines)}
        </Breadcrumbs.Item>
        <Breadcrumbs.Item>{discipline.name}</Breadcrumbs.Item>
      </Breadcrumbs>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <h1
            id="discipline-heading"
            className="text-3xl leading-9 font-semibold tracking-tight wrap-break-word"
          >
            {discipline.name}
          </h1>
          {discipline.description ? (
            <p className="text-base leading-7 wrap-break-word">
              {discipline.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Button
            className="w-full md:w-auto"
            onPress={() => setDialog("addGoal")}
          >
            <Plus className="size-4" aria-hidden="true" />
            {t(($) => $.disciplines.addGoal)}
          </Button>
          <div className="flex items-center gap-3">
            {/* Dogs pick goals in a later flow; the action stays visible. */}
            <Button variant="secondary" isDisabled className="flex-1">
              <FileArrowUp className="size-4" aria-hidden="true" />
              {t(($) => $.disciplines.assignToDog)}
            </Button>
            <ItemMenu
              size="md"
              label={t(($) => $.disciplines.actions)}
              onEdit={() => setDialog("edit")}
              onDelete={() => {
                remove.reset();
                setDialog("delete");
              }}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-8 md:flex-row">
        <section
          aria-labelledby="goals-heading"
          className="flex min-w-0 flex-1 flex-col gap-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="goals-heading"
              className="text-xl leading-7 font-semibold tracking-tight"
            >
              {t(($) => $.disciplines.goals)}
            </h2>
            {discipline.goals.length > 0 ? (
              <p className="text-sm leading-6 text-muted">
                {t(($) => $.disciplines.goalsSummary, {
                  goals: t(
                    ($) =>
                      $.disciplines.goalCount[
                        pluralForm(discipline.goals.length)
                      ],
                    { count: discipline.goals.length },
                  ),
                  exercises: t(
                    ($) =>
                      $.disciplines.exerciseCount[pluralForm(exerciseCount)],
                    { count: exerciseCount },
                  ),
                })}
              </p>
            ) : null}
          </div>
          {discipline.goals.length === 0 ? (
            <EmptyState
              icon={CircleDashed}
              title={t(($) => $.disciplines.goalsEmptyTitle)}
              description={t(($) => $.disciplines.goalsEmptyDescription)}
            />
          ) : (
            <ul className="flex flex-col gap-6">
              {discipline.goals.map((goal) => (
                <li key={goal.id}>
                  <GoalCard discipline={discipline} goal={goal} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <Separator orientation="vertical" className="hidden md:block" />
        <div className="md:w-80 md:shrink-0">
          <DisciplineDogs dogs={discipline.dogs} />
        </div>
      </div>
      <GoalDialog
        isOpen={dialog === "addGoal"}
        onOpenChange={close}
        discipline={discipline}
      />
      <DisciplineDialog
        isOpen={dialog === "edit"}
        onOpenChange={close}
        discipline={discipline}
      />
      <DeleteDialog
        isOpen={dialog === "delete"}
        onOpenChange={close}
        title={t(($) => $.disciplines.deleteDialog.disciplineTitle, {
          name: discipline.name,
        })}
        body={t(($) => $.disciplines.deleteDialog.disciplineBody)}
        affectedDogCount={discipline.dogs.length}
        isPending={remove.isPending}
        isError={remove.isError}
        onConfirm={() =>
          remove.mutate(discipline.id, {
            onSuccess: () => void navigate({ to: ROUTES.disciplines }),
          })
        }
      />
    </>
  );
}
