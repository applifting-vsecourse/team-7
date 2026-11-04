import type { CSSProperties } from "react";
import { parseISO } from "date-fns";
import { useTranslation } from "react-i18next";

import type { ScheduledEvent } from "@/features/events/api/eventsQueryOptions";

// Each point pops in as the drawn line reaches it.
const progress = (index: number, count: number) =>
  ({ "--progress": index / Math.max(1, count - 1) }) as CSSProperties;

export function ExerciseRatingChart({ events }: { events: ScheduledEvent[] }) {
  const { t, i18n } = useTranslation();
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage ?? "cs", {
    day: "numeric",
    month: "numeric",
  });
  const points = events.map((event, index) => ({
    event,
    x: 72 + (index * 704) / (events.length - 1),
    y: 160 - (event.rating! - 1) * 32,
  }));
  const line = points.map(({ x, y }) => `${x},${y}`).join(" ");
  return (
    <div className="w-full rounded-2xl bg-background p-4">
      <svg
        viewBox="0 0 800 208"
        role="img"
        aria-label={t(($) => $.exerciseDetail.chart)}
        className="hidden h-44 w-full sm:block"
        preserveAspectRatio="none"
      >
        {[1, 2, 3, 4, 5].map((rating) => (
          <g key={rating}>
            <line
              x1={64}
              x2={784}
              y1={160 - (rating - 1) * 32}
              y2={160 - (rating - 1) * 32}
              className="stroke-border"
            />
            <text
              x={0}
              y={164 - (rating - 1) * 32}
              className="fill-current text-xs text-warning"
            >
              {"★".repeat(rating)}
              <tspan className="text-muted">{"☆".repeat(5 - rating)}</tspan>
            </text>
          </g>
        ))}
        <polygon
          points={`72,160 ${line} 776,160`}
          className="animate-fade fill-accent-soft"
        />
        <polyline
          points={line}
          fill="none"
          pathLength={1}
          className="draw-in stroke-accent"
          strokeWidth={2}
        />
        {points.map(({ event, x, y }, index) => (
          <g key={event.id}>
            <circle
              cx={x}
              cy={y}
              r={5}
              className="origin-center animate-pop fill-accent stroke-background draw-delay transform-fill"
              style={progress(index, points.length)}
              strokeWidth={2}
            >
              <title>
                {t(($) => $.exerciseDetail.chartPoint, {
                  date: date.format(parseISO(event.completedAt!)),
                  rating: event.rating,
                })}
              </title>
            </circle>
            <text
              x={x}
              y={194}
              textAnchor="middle"
              className="fill-current text-xs"
            >
              {date.format(parseISO(event.completedAt!))}
            </text>
          </g>
        ))}
      </svg>
      <svg
        viewBox="0 0 320 208"
        role="img"
        aria-label={t(($) => $.exerciseDetail.chart)}
        className="h-44 w-full sm:hidden"
        preserveAspectRatio="none"
      >
        {[1, 2, 3, 4, 5].map((rating) => (
          <g key={rating}>
            <line
              x1={56}
              x2={312}
              y1={160 - (rating - 1) * 32}
              y2={160 - (rating - 1) * 32}
              className="stroke-border"
            />
            <text
              x={0}
              y={164 - (rating - 1) * 32}
              className="fill-current text-xs text-warning"
            >
              {"★".repeat(rating)}
              <tspan className="text-muted">{"☆".repeat(5 - rating)}</tspan>
            </text>
          </g>
        ))}
        <polygon
          points={`60,160 ${points.map(({ y }, index) => `${60 + (index * 244) / (points.length - 1)},${y}`).join(" ")} 304,160`}
          className="animate-fade fill-accent-soft"
        />
        <polyline
          points={points
            .map(
              ({ y }, index) =>
                `${60 + (index * 244) / (points.length - 1)},${y}`,
            )
            .join(" ")}
          fill="none"
          pathLength={1}
          className="draw-in stroke-accent"
          strokeWidth={2}
        />
        {points.map(({ event, y }, index) => (
          <g key={event.id}>
            <circle
              cx={60 + (index * 244) / (points.length - 1)}
              cy={y}
              r={4}
              className="origin-center animate-pop fill-accent stroke-background draw-delay transform-fill"
              style={progress(index, points.length)}
              strokeWidth={2}
            >
              <title>
                {t(($) => $.exerciseDetail.chartPoint, {
                  date: date.format(parseISO(event.completedAt!)),
                  rating: event.rating,
                })}
              </title>
            </circle>
            {(index % Math.max(1, Math.ceil(points.length / 4)) === 0 ||
              index === points.length - 1) && (
              <text
                x={60 + (index * 244) / (points.length - 1)}
                y={194}
                textAnchor="middle"
                className="fill-current text-xs"
              >
                {date.format(parseISO(event.completedAt!))}
              </text>
            )}
          </g>
        ))}
      </svg>
      <table className="sr-only">
        <caption>{t(($) => $.exerciseDetail.chart)}</caption>
        <thead>
          <tr>
            <th>{t(($) => $.planning.date)}</th>
            <th>{t(($) => $.training.rating)}</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{date.format(parseISO(event.completedAt!))}</td>
              <td>{event.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
