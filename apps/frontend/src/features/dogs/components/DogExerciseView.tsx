import { useLayoutEffect, useRef, useState } from "react";
import type { DogExerciseDetail } from "../api/dogExerciseQueryOptions";
import type { ExerciseStatus } from "../schemas/statusSchema";
import {
  ArrowRotateLeft,
  Calendar,
  CircleCheck,
  CirclePause,
  Clock,
  Flag,
  Plus,
  Star,
  TrashBin,
} from "@gravity-ui/icons";
import {
  Alert,
  Breadcrumbs,
  Button,
  Chip,
  ScrollShadow,
  toast,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api-client";

import { useSession } from "@/features/auth/hooks/useSession";
import { disciplinesKey } from "@/features/disciplines/api/disciplinesQueryOptions";
import { ContextLine } from "@/features/disciplines/components/ContextLine";
import { EmptyState } from "@/features/disciplines/components/EmptyState";
import {
  eventsKey,
  planningExercisesKey,
  type ScheduledEvent,
} from "@/features/events/api/eventsQueryOptions";
import { Event } from "@/features/events/components/Event";
import { ScheduleExerciseDialog } from "@/features/events/components/ScheduleExerciseDialog";

import {
  dogProfileKey,
  dogDisciplinePath,
} from "../api/dogProfileQueryOptions";
import { useStatusMutation } from "../hooks/useStatusMutation";
import { exerciseHistory } from "../lib/exerciseHistory";
import { isPlannable } from "../lib/exerciseStatus";
import { ActionsMenu, type MenuAction } from "./ActionsMenu";
import { DogStat } from "./DogStat";
import { ExerciseRatingChart } from "./ExerciseRatingChart";

export function DogExerciseView({ detail }: { detail: DogExerciseDetail }) {
  const { t, i18n } = useTranslation();
  const { user } = useSession();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [today] = useState(() => new Date());
  const [scheduling, setScheduling] = useState(false);
  const { dog, exercise } = detail;
  const { goal, status, goalStatus } = exercise;
  const stats = exerciseHistory(detail.events, today);
  // An archived dog's history stays viewable, but nothing is changed or planned.
  const readOnly = Boolean(dog.archivedAt);
  const setStatus = useStatusMutation(dog.id);
  // Figma S4 608:15330 (in progress), S5b 619:25095 (paused); a mastered
  // exercise offers pausing instead of mastering.
  const pause: MenuAction = {
    id: "paused",
    icon: CirclePause,
    label: t(($) => $.status.pauseExercise),
    hint: t(($) => $.status.pauseHint),
  };
  const resume: MenuAction = {
    id: "in_progress",
    icon: ArrowRotateLeft,
    label: t(($) => $.status.resume),
    hint: t(($) => $.status.resumeExerciseHint),
  };
  const master: MenuAction = {
    id: "mastered",
    icon: CircleCheck,
    label: t(($) => $.status.markMastered),
    hint: t(($) => $.status.markMasteredHint, { name: dog.name }),
  };
  const menu: MenuAction[] = [
    ...(status === "paused"
      ? [resume, master]
      : status === "mastered"
        ? [resume, pause]
        : [pause, master]),
    {
      id: "remove",
      icon: TrashBin,
      label: t(($) => $.dogProfile.removeExercise),
      hint: t(($) => $.exerciseDetail.removeDescription, { name: dog.name }),
      danger: true,
    },
  ];
  // Why the exercise can't be scheduled now; the own status first, because
  // it is changed right here.
  const notPlannable =
    status === "paused"
      ? t(($) => $.status.notPlannable.exercisePaused)
      : status === "mastered"
        ? t(($) => $.status.notPlannable.exerciseMastered)
        : goalStatus === "paused"
          ? t(($) => $.status.notPlannable.goalPaused, { goal: goal.name })
          : goalStatus === "completed"
            ? t(($) => $.status.notPlannable.goalCompleted, {
                goal: goal.name,
              })
            : null;
  const scroller = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (scroller.current) {
      scroller.current.scrollLeft = scroller.current.scrollWidth;
    }
  }, [stats.history.length]);
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: dogProfileKey(user?.id) }),
      client.invalidateQueries({ queryKey: eventsKey(user?.id) }),
      client.invalidateQueries({ queryKey: disciplinesKey(user?.id) }),
      client.invalidateQueries({
        queryKey: planningExercisesKey(user?.id, dog.id),
      }),
    ]);
  const path = `${dogDisciplinePath(dog.id, goal.discipline.id)}/goals/${encodeURIComponent(goal.id)}/exercises`;
  const remove = useMutation({
    mutationFn: () => api.delete(`${path}/${encodeURIComponent(exercise.id)}`),
    onSuccess: async () => {
      let undoPending = false;
      const toastId = toast.success(
        t(($) => $.exerciseDetail.removed),
        {
          timeout: 10000,
          actionProps: {
            children: t(($) => $.training.undo),
            variant: "ghost",
            onPress: () => {
              void (async () => {
                if (undoPending) return;
                undoPending = true;
                try {
                  await api.post(path, { json: { exerciseId: exercise.id } });
                  await refresh();
                  toast.close(toastId);
                  toast.success(t(($) => $.exerciseDetail.restored));
                } catch {
                  toast.danger(t(($) => $.training.undoError));
                } finally {
                  undoPending = false;
                }
              })();
            },
          },
        },
      );
      await refresh();
      await navigate({
        to: "/dogs/$dogId/disciplines/$disciplineId",
        params: { dogId: dog.id, disciplineId: goal.discipline.id },
      });
    },
  });
  const dateFormatter = new Intl.DateTimeFormat(i18n.resolvedLanguage ?? "cs", {
    day: "numeric",
    month: "numeric",
  });
  const weekdayFormatter = new Intl.DateTimeFormat(
    i18n.resolvedLanguage ?? "cs",
    { weekday: "short" },
  );
  const days = new Map<string, ScheduledEvent[]>();
  for (const event of stats.history) {
    const key = format(
      parseISO(event.completedAt ?? event.startsAt),
      "yyyy-MM-dd",
    );
    days.set(key, [...(days.get(key) ?? []), event]);
  }
  return (
    <>
      <Breadcrumbs
        aria-label={t(($) => $.disciplines.breadcrumbs)}
        className="max-w-full min-w-0 [&_.breadcrumbs__link]:min-w-0 [&_.breadcrumbs__separator]:shrink-0"
      >
        <Breadcrumbs.Item className="min-w-0 shrink">
          <Link
            to="/dogs/$dogId"
            params={{ dogId: dog.id }}
            className="block max-w-breadcrumb-item truncate"
            title={dog.name}
          >
            {dog.name}
          </Link>
        </Breadcrumbs.Item>
        <Breadcrumbs.Item className="min-w-0 shrink">
          <Link
            to="/dogs/$dogId/disciplines/$disciplineId"
            params={{ dogId: dog.id, disciplineId: goal.discipline.id }}
            className="block max-w-breadcrumb-item truncate"
            title={goal.discipline.name}
          >
            {goal.discipline.name}
          </Link>
        </Breadcrumbs.Item>
        <Breadcrumbs.Item className="min-w-0 shrink">
          <span
            className="block max-w-breadcrumb-item truncate"
            title={exercise.name}
          >
            {exercise.name}
          </span>
        </Breadcrumbs.Item>
      </Breadcrumbs>
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-4">
          {/* Figma S5 608:26695 "Title + status": the chip wraps under a long name. */}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="min-w-0 text-3xl leading-9 font-semibold tracking-tight wrap-break-word">
              {exercise.name}
            </h1>
            {status === "mastered" ? (
              <Chip color="success" size="sm">
                <CircleCheck className="size-3" aria-hidden="true" />
                <Chip.Label>{t(($) => $.status.mastered)}</Chip.Label>
              </Chip>
            ) : status === "paused" || goalStatus === "paused" ? (
              // Says why: its own pause, or only its goal's.
              <Chip size="sm">
                <CirclePause className="size-3" aria-hidden="true" />
                <Chip.Label>
                  {status === "paused"
                    ? t(($) => $.status.paused)
                    : t(($) => $.status.goalPausedChip)}
                </Chip.Label>
              </Chip>
            ) : null}
          </div>
          {status && !readOnly && (
            <ActionsMenu
              variant="secondary"
              label={t(($) => $.disciplines.exerciseActions, {
                name: exercise.name,
              })}
              actions={menu}
              isDisabled={remove.isPending}
              onAction={(key) => {
                if (key === "remove") {
                  remove.mutate();
                  return;
                }
                setStatus.mutate({
                  kind: "exercise",
                  disciplineId: goal.discipline.id,
                  goalId: goal.id,
                  exerciseId: exercise.id,
                  name: exercise.name,
                  status: key as ExerciseStatus,
                });
              }}
            />
          )}
        </div>
        {/* Same context line as the exercise dialogs: "🏳 Cíl: name". */}
        <ContextLine
          icon={
            <Flag className="size-4 shrink-0 text-warning" aria-hidden="true" />
          }
          label={t(($) => $.disciplines.exerciseForm.context)}
          value={goal.name}
        />
      </div>
      <p className="text-base leading-7 whitespace-pre-wrap">
        {exercise.procedure || t(($) => $.training.noProcedure)}
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-x-10">
        <DogStat
          icon={Star}
          tone="warning"
          value={
            stats.average === null
              ? t(($) => $.dogProfile.noData)
              : t(($) => $.exerciseDetail.ratingValue, {
                  rating: new Intl.NumberFormat(i18n.resolvedLanguage ?? "cs", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }).format(stats.average),
                })
          }
          label={t(($) => $.exerciseDetail.averageRating)}
        />
        <DogStat
          icon={Clock}
          value={
            stats.lastTraining
              ? dateFormatter.format(parseISO(stats.lastTraining))
              : t(($) => $.dogProfile.noData)
          }
          label={t(($) => $.exerciseDetail.lastTraining)}
        />
      </div>
      {remove.isError && (
        <p role="alert" className="text-sm text-danger">
          {t(($) => $.disciplines.saveError)}
        </p>
      )}
      <section
        className="flex min-w-0 flex-col gap-3"
        aria-labelledby="exercise-history-heading"
      >
        <h2
          id="exercise-history-heading"
          className="text-2xl font-semibold tracking-tight"
        >
          {t(($) => $.exerciseDetail.history)}
        </h2>
        {stats.history.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={t(($) => $.exerciseDetail.emptyTitle)}
            description={
              (exercise.assigned && notPlannable) ||
              t(($) => $.exerciseDetail.emptyDescription)
            }
            action={
              !readOnly &&
              status &&
              goalStatus &&
              isPlannable(goalStatus, status) ? (
                <Button onPress={() => setScheduling(true)}>
                  <Plus className="size-4" aria-hidden="true" />
                  {t(($) => $.calendar.scheduleExercise)}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ScrollShadow
            ref={scroller}
            orientation="horizontal"
            className="w-full pb-3"
            tabIndex={0}
            role="region"
            aria-labelledby="exercise-history-heading"
          >
            <div className="flex w-max items-start gap-3 px-3 py-2">
              {[...days].map(([key, events]) => {
                const date = parseISO(key);
                return (
                  <section
                    key={key}
                    aria-label={dateFormatter.format(date)}
                    className="flex w-calendar-cell shrink-0 flex-col gap-3"
                  >
                    <h3 className="flex items-baseline gap-2 px-2 font-medium">
                      <span className="text-sm text-muted">
                        {weekdayFormatter.format(date)}
                      </span>
                      <time dateTime={key} className="text-base">
                        {dateFormatter.format(date)}
                      </time>
                    </h3>
                    <ul className="flex flex-col gap-3">
                      {events.map((event) => (
                        <li key={event.id}>
                          <Event
                            scheduledEvent={event}
                            historyOnly
                            dogName={dog.name}
                            discipline={goal.discipline.name}
                            exercise={exercise.name}
                            time={format(
                              parseISO(event.completedAt ?? event.startsAt),
                              "HH:mm",
                            )}
                            durationMinutes={event.durationMinutes}
                            state={
                              event.completedAt ? "completed" : "unfinished"
                            }
                            headingLevel="h4"
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </ScrollShadow>
        )}
      </section>
      {stats.history.length > 0 && (
        <section
          className="flex w-full max-w-200 flex-col gap-4"
          aria-labelledby="exercise-rating-heading"
        >
          <h2
            id="exercise-rating-heading"
            className="text-2xl font-semibold tracking-tight"
          >
            {t(($) => $.exerciseDetail.chart)}
          </h2>
          {stats.completed.length < 2 ? (
            <Alert status="accent">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>
                  {t(($) => $.exerciseDetail.chartWaiting)}
                </Alert.Title>
              </Alert.Content>
            </Alert>
          ) : (
            <ExerciseRatingChart events={stats.completed} />
          )}
        </section>
      )}
      {scheduling && (
        <ScheduleExerciseDialog
          date={today}
          initialDogId={dog.id}
          initialExerciseId={exercise.id}
          onClose={() => setScheduling(false)}
        />
      )}
    </>
  );
}
