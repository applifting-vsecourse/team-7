import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { type TranslationSelector } from "@/i18n/messages";
import { cn, transitionName } from "@/lib/utils";

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
  /** Stretches the options across the row, as on the mobile layout. */
  fullWidth?: boolean;
  className?: string;
};

export function CalendarViewSwitcher({
  value,
  onChange,
  fullWidth,
  className,
}: CalendarViewSwitcherProps) {
  const { t } = useTranslation();

  return (
    <ToggleButtonGroup
      aria-label={t(($) => $.calendar.views.label)}
      selectionMode="single"
      disallowEmptySelection
      isDetached
      fullWidth={fullWidth}
      selectedKeys={[value]}
      onSelectionChange={(keys) => {
        const [view] = keys;
        if (view) onChange(view as CalendarView);
      }}
      className={cn("gap-2", className)}
    >
      {CALENDAR_VIEWS.map((view) => (
        <ToggleButton
          key={view}
          id={view}
          className={cn(fullWidth && "flex-1")}
          // Slides the selection to the new view across the navigation's view
          // transition; the switcher hidden at this breakpoint isn't captured.
          style={view === value ? transitionName("calendar-view") : undefined}
        >
          {t(labels[view])}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
