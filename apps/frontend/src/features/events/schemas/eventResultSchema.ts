import { format } from "date-fns";
import { keyFromSelector } from "i18next";
import { z } from "zod";

import { messageSelectors } from "@/i18n/messages";

import { scheduleSchema } from "./scheduleSchema";

export const eventResultSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, keyFromSelector(messageSelectors.trainingRating))
    .max(5, keyFromSelector(messageSelectors.trainingRating)),
  note: z.string().max(1000, keyFromSelector(messageSelectors.trainingNote)),
});
export type EventResultValues = z.infer<typeof eventResultSchema>;
export const moveEventSchema = scheduleSchema.superRefine((values, context) => {
  values.exercises.forEach((item, index) => {
    if (item.date < format(new Date(), "yyyy-MM-dd")) {
      context.addIssue({
        code: "custom",
        path: ["exercises", index, "date"],
        message: keyFromSelector(messageSelectors.trainingFutureDate),
      });
    }
  });
});
