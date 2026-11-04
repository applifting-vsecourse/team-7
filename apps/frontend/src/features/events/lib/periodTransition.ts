import type { CalendarView } from "../components/CalendarViewSwitcher";
import { isSameDay, isSameMonth } from "date-fns";

/**
 * View transition for a calendar date change: paging to another day or month
 * slides the period in its direction; picking a day within the shown month
 * only gets the default crossfade.
 */
export function periodTransition(view: CalendarView, from: Date, to: Date) {
  const samePeriod =
    view === "month" ? isSameMonth(from, to) : isSameDay(from, to);
  return samePeriod ? true : { types: [to < from ? "back" : "forward"] };
}
