import type { CSSProperties, ReactNode } from "react";
import { parseISO } from "date-fns";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export type TrendPoint = {
  id: string;
  date: string;
  /** Position on the Y axis, 0 (bottom grid line) to 1 (top). */
  value: number;
  /** The value as the accessible table shows it. */
  text: ReactNode;
  title: string;
};

// Figma "Rating Chart" (464:4152) and "Success Chart" (791:4742).
const tones = {
  accent: {
    area: "fill-accent-soft",
    line: "stroke-accent",
    point: "fill-accent",
  },
  success: {
    area: "fill-success-soft",
    line: "stroke-success",
    point: "fill-success",
  },
};

// Each point pops in as the drawn line reaches it.
const progress = (index: number, count: number) =>
  ({ "--progress": index / Math.max(1, count - 1) }) as CSSProperties;

const y = (value: number) => 160 - value * 128;

export function ExerciseTrendChart({
  points,
  ticks,
  tone,
  label,
  valueHeader,
}: {
  points: TrendPoint[];
  /** Five Y axis labels, bottom to top. */
  ticks: ReactNode[];
  tone: keyof typeof tones;
  label: string;
  valueHeader: string;
}) {
  const { t, i18n } = useTranslation();
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage ?? "cs", {
    day: "numeric",
    month: "numeric",
  });
  const colors = tones[tone];
  // Desktop shows every date; the narrow plot only about four of them.
  const plot = (
    width: number,
    [gridStart, gridEnd]: [number, number],
    [first, last]: [number, number],
    radius: number,
    labelEvery: number,
    className: string,
  ) => {
    const x = (index: number) =>
      first + (index * (last - first)) / Math.max(1, points.length - 1);
    const line = points.map(({ value }, i) => `${x(i)},${y(value)}`).join(" ");
    return (
      <svg
        viewBox={`0 0 ${width} 208`}
        role="img"
        aria-label={label}
        className={cn("h-44 w-full", className)}
        preserveAspectRatio="none"
      >
        {ticks.map((tick, index) => (
          <g key={index}>
            <line
              x1={gridStart}
              x2={gridEnd}
              y1={y(index / 4)}
              y2={y(index / 4)}
              className="stroke-border"
            />
            <text x={0} y={y(index / 4) + 4} className="fill-current text-xs">
              {tick}
            </text>
          </g>
        ))}
        <polygon
          points={`${x(0)},160 ${line} ${x(points.length - 1)},160`}
          className={cn("animate-fade", colors.area)}
        />
        <polyline
          points={line}
          fill="none"
          pathLength={1}
          className={cn("draw-in", colors.line)}
          strokeWidth={2}
        />
        {points.map((point, index) => (
          <g key={point.id}>
            <circle
              cx={x(index)}
              cy={y(point.value)}
              r={radius}
              className={cn(
                "origin-center animate-pop stroke-background draw-delay transform-fill",
                colors.point,
              )}
              style={progress(index, points.length)}
              strokeWidth={2}
            >
              <title>{point.title}</title>
            </circle>
            {(index % labelEvery === 0 || index === points.length - 1) && (
              <text
                x={x(index)}
                y={194}
                textAnchor="middle"
                className="fill-current text-xs"
              >
                {date.format(parseISO(point.date))}
              </text>
            )}
          </g>
        ))}
      </svg>
    );
  };
  return (
    <div className="w-full rounded-2xl bg-background p-4">
      {plot(800, [64, 784], [72, 776], 5, 1, "hidden sm:block")}
      {plot(
        320,
        [56, 312],
        [60, 304],
        4,
        Math.max(1, Math.ceil(points.length / 4)),
        "sm:hidden",
      )}
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>{t(($) => $.planning.date)}</th>
            <th>{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.id}>
              <td>{date.format(parseISO(point.date))}</td>
              <td>{point.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
