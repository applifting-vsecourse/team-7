import { useEffect, useRef } from "react";
import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { type TranslationSelector } from "@/i18n/messages";

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
};

// Each view renders its own switcher, so a change mounts a new one and focus
// has to follow, or keyboard users would drop back to the top of the page.
let refocus = false;

/** One attached group; stretches across the row on phones, as in Figma. */
export function CalendarViewSwitcher({
  value,
  onChange,
}: CalendarViewSwitcherProps) {
  const { t } = useTranslation();
  const selectedRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (refocus) selectedRef.current?.focus();
    refocus = false;
  }, []);

  return (
    <ToggleButtonGroup
      aria-label={t(($) => $.calendar.views.label)}
      selectionMode="single"
      disallowEmptySelection
      size="sm"
      selectedKeys={[value]}
      onSelectionChange={(keys) => {
        const [view] = keys;
        if (!view) return;
        refocus = true;
        onChange(view as CalendarView);
      }}
      className="w-full md:w-auto"
    >
      {CALENDAR_VIEWS.map((view, index) => (
        <ToggleButton
          key={view}
          id={view}
          className="flex-1 md:flex-none"
          ref={view === value ? selectedRef : undefined}
        >
          {index > 0 && <ToggleButtonGroup.Separator />}
          {t(labels[view])}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
