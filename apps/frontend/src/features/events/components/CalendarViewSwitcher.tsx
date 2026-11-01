import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { type TranslationSelector } from "@/i18n/messages";
import { cn } from "@/lib/utils";

export const CALENDAR_VIEWS = ["day", "week", "month"] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];

const labels = {
  day: ($) => $.calendar.views.day,
  week: ($) => $.calendar.views.week,
  month: ($) => $.calendar.views.month,
} satisfies Record<CalendarView, TranslationSelector>;

type CalendarViewSwitcherProps = {
  value: CalendarView;
  onChange: (view: CalendarView) => void;
  className?: string;
};

/** One attached group; stretches across the row on phones, as in Figma. */
export function CalendarViewSwitcher({
  value,
  onChange,
  className,
}: CalendarViewSwitcherProps) {
  const { t } = useTranslation();

  return (
    <ToggleButtonGroup
      aria-label={t(($) => $.calendar.views.label)}
      selectionMode="single"
      disallowEmptySelection
      size="sm"
      selectedKeys={[value]}
      onSelectionChange={(keys) => {
        const [view] = keys;
        if (view) onChange(view as CalendarView);
      }}
      className={cn("w-full md:w-auto", className)}
    >
      {CALENDAR_VIEWS.map((view, index) => (
        <ToggleButton key={view} id={view} className="flex-1 md:flex-none">
          {index > 0 && <ToggleButtonGroup.Separator />}
          {t(labels[view])}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
