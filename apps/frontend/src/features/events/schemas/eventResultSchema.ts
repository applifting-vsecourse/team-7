import { keyFromSelector } from "i18next";
import { z } from "zod";

import { messageSelectors } from "@/i18n/messages";

export const eventResultSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, keyFromSelector(messageSelectors.trainingRating))
    .max(5, keyFromSelector(messageSelectors.trainingRating)),
  note: z.string().max(1000, keyFromSelector(messageSelectors.trainingNote)),
});
export type EventResultValues = z.infer<typeof eventResultSchema>;
