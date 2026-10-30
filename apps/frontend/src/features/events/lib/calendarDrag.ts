import { isSameDay, parseISO, set } from "date-fns";
import { z } from "zod";

/** Drag item type that carries a scheduled exercise between calendar days. */
export const scheduledEventDragType = "application/x-trainloop-scheduled-event";

export const draggedEventSchema = z.object({
  id: z.string(),
  startsAt: z.string(),
  durationMinutes: z.number(),
});
export type DraggedEvent = z.infer<typeof draggedEventSchema>;

/**
 * Moves a start to another day while keeping its local wall-clock time.
 * Returns null when the target is the original day, so nothing needs saving.
 */
export function moveToDay(startsAt: string, day: Date) {
  const original = parseISO(startsAt);
  if (isSameDay(original, day)) return null;
  return set(day, {
    hours: original.getHours(),
    minutes: original.getMinutes(),
    seconds: 0,
    milliseconds: 0,
  });
}
