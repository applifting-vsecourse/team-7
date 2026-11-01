import { keyFromSelector } from "i18next";
import { z } from "zod";

import { messageSelectors } from "@/i18n/messages";

export const passwordWithConfirmationSchema = z
  .object({
    password: z
      .string()
      .trim()
      .min(8, keyFromSelector(messageSelectors.passwordMinLength)),
    passwordConfirmation: z
      .string()
      .trim()
      .min(1, keyFromSelector(messageSelectors.passwordConfirmationRequired)),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: keyFromSelector(messageSelectors.passwordMismatch),
    path: ["passwordConfirmation"],
  });
