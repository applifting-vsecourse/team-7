import { keyFromSelector } from "i18next";
import { z } from "zod";

import { messageSelectors } from "@/i18n/messages";

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, keyFromSelector(messageSelectors.nameRequired)),
  email: z
    .string()
    .trim()
    .email(keyFromSelector(messageSelectors.emailInvalid)),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, keyFromSelector(messageSelectors.passwordRequired)),
    password: z
      .string()
      .min(8, keyFromSelector(messageSelectors.passwordMinLength))
      .max(128, keyFromSelector(messageSelectors.textTooLong)),
    passwordConfirmation: z
      .string()
      .min(1, keyFromSelector(messageSelectors.passwordConfirmationRequired)),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: keyFromSelector(messageSelectors.passwordMismatch),
    path: ["passwordConfirmation"],
  });

export const deleteAccountSchema = (email: string, hasPassword: boolean) =>
  z.object({
    confirmation: z.literal(email, {
      error: keyFromSelector(messageSelectors.deleteConfirmation),
    }),
    password: hasPassword
      ? z.string().min(1, keyFromSelector(messageSelectors.passwordRequired))
      : z.string().optional(),
  });

export const accountSummarySchema = z.object({
  dogs: z.number().int().nonnegative(),
  disciplines: z.number().int().nonnegative(),
  exercises: z.number().int().nonnegative(),
  videos: z.number().int().nonnegative(),
});
