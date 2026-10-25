import { useLayoutEffect, useRef, useState } from "react";
import type { DogExerciseDetail } from "../api/dogExerciseQueryOptions";
import {
  Calendar,
  Clock,
  EllipsisVertical,
  Flag,
  Plus,
  Star,
  TrashBin,
} from "@gravity-ui/icons";
import {
  Alert,
  Breadcrumbs,
  Button,
  Description,
  Dropdown,
  Label,
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
import { exerciseHistory } from "../lib/exerciseHistory";
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
  const { goal } = exercise;
  const stats = exerciseHistory(detail.events, today);
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
          <h1 className="min-w-0 flex-1 text-3xl leading-9 font-semibold tracking-tight wrap-break-word">
            {exercise.name}
          </h1>
          {exercise.assigned && (
            <Dropdown>
              <Button
                isIconOnly
                size="sm"
                variant="secondary"
                isDisabled={remove.isPending}
                aria-label={t(($) => $.disciplines.exerciseActions, {
                  name: exercise.name,
                })}
              >
                <EllipsisVertical className="size-4" aria-hidden="true" />
              </Button>
              <Dropdown.Popover placement="bottom end" className="max-w-60">
                <Dropdown.Menu onAction={() => remove.mutate()}>
                  <Dropdown.Item
                    id="remove"
                    variant="danger"
                    textValue={t(($) => $.dogProfile.removeExercise)}
                  >
                    <TrashBin className="size-4 shrink-0" aria-hidden="true" />
                    <div className="flex flex-col">
                      <Label>{t(($) => $.dogProfile.removeExercise)}</Label>
                      <Description>
                        {t(($) => $.exerciseDetail.removeDescription, {
                          name: dog.name,
                        })}
                      </Description>
                    </div>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          )}
        </div>
        <p className="flex items-center gap-2 text-base leading-7 text-muted">
          <Flag className="size-5 shrink-0 text-warning" aria-hidden="true" />
          {t(($) => $.exerciseDetail.goal, { name: goal.name })}
        </p>
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
            description={t(($) => $.exerciseDetail.emptyDescription)}
            action={
              exercise.assigned ? (
                <Button size="sm" onPress={() => setScheduling(true)}>
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
