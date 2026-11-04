import { type CSSProperties, useId } from "react";
import type { WeeklyStatsData } from "../api/overviewQueryOptions";
import { ChartLine, Clock, Flame, Star } from "@gravity-ui/icons";
import { Chip, ProgressCircle, Separator } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

export function WeeklyStats({ data }: { data: WeeklyStatsData }) {
  const { t, i18n } = useTranslation();
  const headingId = useId();
  const trendId = useId();
  const locale = i18n.resolvedLanguage ?? "cs";
  // The headline numbers count up when the overview opens.
  const streakDays = Math.round(useCountUp(data.streakDays));
  const trainingMinutes = Math.round(useCountUp(data.trainingMinutes));
  const satisfaction = useCountUp(data.satisfaction ?? 0);
  const dateFormat = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "numeric",
  });
  const ratingFormat = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const formatDate = (date: string) =>
    dateFormat.format(new Date(`${date}T12:00:00`));
  const completedLabel = t(($) => $.weeklyStats.completed, {
    completed: data.completedExercises,
    total: data.plannedExercises,
  });
  const remaining = Math.max(
    0,
    data.plannedExercises - data.completedExercises,
  );
  const remainingLabel =
    remaining === 1
      ? t(($) => $.weeklyStats.remainingOne, { count: remaining })
      : remaining >= 2 && remaining <= 4
        ? t(($) => $.weeklyStats.remainingFew, { count: remaining })
        : t(($) => $.weeklyStats.remaining, { count: remaining });
  const currentIndex = data.satisfactionHistory.findIndex(
    (week) => week.weekStart === data.weekStart,
  );
  const previousWeek = data.satisfactionHistory[currentIndex - 1];
  const previousRating =
    previousWeek &&
    Date.parse(data.weekStart) - Date.parse(previousWeek.weekStart) ===
      7 * 86400000
      ? previousWeek.rating
      : undefined;
  const trend =
    previousRating === undefined || data.satisfaction === null
      ? null
      : data.satisfaction - previousRating;
  const metrics = [
    {
      label: t(($) => $.weeklyStats.streak),
      icon: Flame,
      color: "text-warning",
      value: t(($) => $.weeklyStats.days, {
        value: new Intl.NumberFormat(locale, {
          style: "unit",
          unit: "day",
          unitDisplay: "long",
        }).format(streakDays),
      }),
    },
    {
      label: t(($) => $.weeklyStats.trainingTime),
      icon: Clock,
      color: "text-accent",
      value: t(($) => $.weeklyStats.duration, {
        hours: Math.floor(trainingMinutes / 60),
        minutes: trainingMinutes % 60,
      }),
    },
    {
      label: t(($) => $.weeklyStats.satisfaction),
      icon: Star,
      color: "text-warning",
      value:
        data.satisfaction === null
          ? t(($) => $.dogProfile.noRating)
          : t(($) => $.weeklyStats.rating, {
              value: ratingFormat.format(satisfaction),
            }),
    },
  ];

  return (
    <section
      aria-labelledby={headingId}
      className="flex w-full max-w-xl min-w-weekly-stats-min flex-col items-start gap-4 self-stretch md:w-auto md:flex-1 md:shrink-0 md:self-auto"
    >
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <h2
          id={headingId}
          className="flex items-center gap-2 text-xl leading-7 font-semibold tracking-tight"
        >
          <ChartLine
            className="size-5 shrink-0 text-accent"
            aria-hidden="true"
          />
          {t(($) => $.weeklyStats.title)}
        </h2>
        <p className="text-xs leading-5 text-muted">
          {t(($) => $.weeklyStats.dateRange, {
            start: formatDate(data.weekStart),
            end: formatDate(data.weekEnd),
          })}
        </p>
      </div>

      <div className="flex w-full flex-col gap-4 rounded-2xl bg-background p-4 shadow-surface">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <ProgressCircle
              aria-label={completedLabel}
              value={data.completedExercises}
              maxValue={Math.max(1, data.plannedExercises)}
              size="lg"
              className="shrink-0"
            >
              <ProgressCircle.Track>
                <ProgressCircle.TrackCircle />
                <ProgressCircle.FillCircle />
              </ProgressCircle.Track>
            </ProgressCircle>
            <p className="text-sm leading-6 font-medium">{completedLabel}</p>
          </div>
          <p className="text-xs leading-5 text-muted">{remainingLabel}</p>
        </div>

        <div className="flex h-3 items-center">
          <Separator variant="secondary" />
        </div>

        <dl className="flex flex-wrap gap-x-8 gap-y-4">
          {metrics.map(({ label, icon: Icon, color, value }) => (
            <div key={label} className="flex flex-col gap-1">
              <dt className="flex items-center gap-1 text-xs leading-5 font-medium text-muted">
                <Icon
                  className={`size-4 shrink-0 ${color}`}
                  aria-hidden="true"
                />
                {label}
              </dt>
              <dd className="text-xl leading-7 font-semibold">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex h-3 items-center">
          <Separator variant="secondary" />
        </div>

        <figure aria-labelledby={trendId} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <figcaption id={trendId} className="text-sm leading-6 font-medium">
              {t(($) => $.weeklyStats.weeklySatisfaction)}
            </figcaption>
            {trend !== null && (
              <Chip
                className="animate-enter"
                color={trend > 0 ? "success" : "default"}
                size="sm"
                variant="soft"
              >
                <Star width={12} aria-hidden="true" />
                <Chip.Label>
                  {new Intl.NumberFormat(locale, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                    signDisplay: "exceptZero",
                  }).format(trend)}
                </Chip.Label>
              </Chip>
            )}
          </div>
          {data.satisfactionHistory.length === 0 ? (
            <p className="animate-enter text-xs text-muted">
              {t(($) => $.weeklyStats.emptyHistory)}
            </p>
          ) : (
            // Bars grow in one after another and ease to new values when the
            // dog filter changes; --bar-height matches the bars' h-14.
            <ol className="flex items-end gap-2 [--bar-height:3.5rem]">
              {data.satisfactionHistory.map((week, index) => {
                const isCurrent = week.weekStart === data.weekStart;
                return (
                  <li
                    key={week.weekStart}
                    className="flex min-w-0 flex-1 flex-col items-center gap-1 text-xs leading-5 text-muted"
                    style={
                      {
                        "--ratio": Math.min(5, Math.max(0, week.rating)) / 5,
                        "--i": index,
                      } as CSSProperties
                    }
                  >
                    <span
                      className={cn(
                        "bar-label",
                        isCurrent && "font-medium text-accent",
                      )}
                    >
                      {ratingFormat.format(week.rating)}
                    </span>
                    <div
                      aria-hidden="true"
                      className={cn(
                        "h-14 w-6 max-w-full rounded-md bar-fill",
                        isCurrent ? "bg-accent" : "bg-accent-soft",
                      )}
                    />
                    <time
                      dateTime={week.weekStart}
                      className="whitespace-nowrap"
                    >
                      {formatDate(week.weekStart)}
                    </time>
                  </li>
                );
              })}
            </ol>
          )}
        </figure>
      </div>
    </section>
  );
}
