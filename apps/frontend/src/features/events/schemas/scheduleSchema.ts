import { keyFromSelector } from "i18next";
import { z } from "zod";

import { messageSelectors } from "@/i18n/messages";

const invalid = keyFromSelector(messageSelectors.scheduleInvalid);
export const scheduleSchema = z.object({
  exercises: z
    .array(
      z
        .object({
          exerciseId: z.string().min(1, invalid),
          date: z.iso.date({ error: invalid }),
          time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, invalid),
          durationMinutes: z.number().int().min(1, invalid).max(1440, invalid),
        })
        .refine(
          (value) => {
            const date = new Date(`${value.date}T${value.time}`);
            return (
              !Number.isNaN(date.getTime()) &&
              date.getHours() === Number(value.time.slice(0, 2)) &&
              date.getMinutes() === Number(value.time.slice(3))
            );
          },
          { message: invalid, path: ["time"] },
        ),
    )
    .min(1, invalid)
    .max(100, invalid),
});
export type ScheduleValues = z.infer<typeof scheduleSchema>;
