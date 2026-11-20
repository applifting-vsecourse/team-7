import { type CSSProperties, useId } from "react";
import type { WeeklyStatsData } from "../api/overviewQueryOptions";
import { Target } from "@gravity-ui/icons";
import { Chip } from "@heroui/react";
import { addWeeks, format, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export function WeeklySuccessRate({ data }: { data: WeeklyStatsData }) {
  const { t, i18n } = useTranslation();
  const headingId = useId();
  const locale = i18n.resolvedLanguage ?? "cs";
  const percent = new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 0,
  });
  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "numeric",
  });
  const weeks = Array.from({ length: 6 }, (_, index) => {
    const weekStart = format(
      addWeeks(parseISO(data.weekStart), index - 5),
      "yyyy-MM-dd",
    );
    return {
      weekStart,
      successRate:
        weekStart === data.weekStart
          ? data.successRate
          : (data.successHistory.find((week) => week.weekStart === weekStart)
              ?.successRate ?? null),
    };
  });
  const measured = weeks.filter((week) => week.successRate !== null);
  const latest = weeks.at(-1)?.successRate;
  const previous = weeks.at(-2)?.successRate;
  const trend = latest != null && previous != null ? latest - previous : null;

  return (
    <figure aria-labelledby={headingId} className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <figcaption id={headingId} className="text-sm leading-6 font-medium">
          {t(($) => $.weeklyStats.weeklySuccessRate)}
        </figcaption>
        {trend !== null && (
          <Chip
            color={trend > 0 ? "success" : "default"}
            size="sm"
            variant="soft"
          >
            <Target width={12} aria-hidden="true" />
            <Chip.Label>
              {new Intl.NumberFormat(locale, {
                style: "percent",
                maximumFractionDigits: 0,
                signDisplay: "exceptZero",
              }).format(trend)}
            </Chip.Label>
          </Chip>
        )}
      </div>
      {measured.length === 0 && (
        <p className="animate-enter text-xs text-muted">
          {t(($) => $.weeklyStats.emptySuccessHistory)}
        </p>
      )}
      <ol className="flex items-end gap-2 [--bar-height:3.5rem]">
        {weeks.map((week, index) => {
          const isCurrent = week.weekStart === data.weekStart;
          return (
            <li
              key={week.weekStart}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 text-xs leading-5 text-muted"
              style={
                {
                  "--ratio": week.successRate ?? 0,
                  "--i": index,
                } as CSSProperties
              }
            >
              <span
                className={cn(
                  "bar-label whitespace-nowrap",
                  isCurrent &&
                    week.successRate !== null &&
                    "font-medium text-success-soft-foreground",
                )}
              >
                {week.successRate === null
                  ? t(($) => $.weeklyStats.noMeasurement)
                  : percent.format(week.successRate)}
              </span>
              <div
                aria-hidden="true"
                className={cn(
                  "flex h-14 w-6 max-w-full items-end",
                  week.successRate === null && "justify-center",
                )}
              >
                <div
                  className={cn(
                    "w-full rounded-md",
                    week.successRate === null
                      ? "h-1 bg-default"
                      : cn(
                          "h-14 bar-fill",
                          isCurrent ? "bg-success" : "bg-success-soft",
                        ),
                  )}
                />
              </div>
              <time dateTime={week.weekStart} className="whitespace-nowrap">
                {date.format(parseISO(week.weekStart))}
              </time>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
