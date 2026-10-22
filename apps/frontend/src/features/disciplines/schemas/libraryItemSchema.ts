import { keyFromSelector } from "i18next";
import { z } from "zod";

import { messageSelectors } from "@/i18n/messages";

// Mirrors the backend DTO limits in library-input.dto.ts.
export const NAME_MAX_LENGTH = 100;
export const TEXT_MAX_LENGTH = 1000;

/** Name + optional text: the shape of a discipline, goal and exercise form. */
export const libraryItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, keyFromSelector(messageSelectors.titleRequired))
    .max(NAME_MAX_LENGTH, keyFromSelector(messageSelectors.textTooLong)),
  text: z
    .string()
    .trim()
    .max(TEXT_MAX_LENGTH, keyFromSelector(messageSelectors.textTooLong)),
});

export type LibraryItemValues = z.infer<typeof libraryItemSchema>;
