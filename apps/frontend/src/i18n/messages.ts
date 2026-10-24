import type en from "./en.json";
import { keyFromSelector, type TFunction } from "i18next";

export type TranslationSelector = (resources: typeof en) => string;

// Zod and Error carry strings; derive their keys from checked selectors.
export const messageSelectors = {
  scheduleInvalid: ($) => $.planning.invalid,
  emailRequired: ($) => $.validation.email.required,
  emailInvalid: ($) => $.validation.email.invalid,
  passwordRequired: ($) => $.validation.password.required,
  passwordMinLength: ($) => $.validation.password.minLength,
  passwordConfirmationRequired: ($) =>
    $.validation.password.confirmationRequired,
  passwordMismatch: ($) => $.validation.password.mismatch,
  nameRequired: ($) => $.validation.name.required,
  titleRequired: ($) => $.validation.title.required,
  textTooLong: ($) => $.validation.title.tooLong,
  dogPhotoInvalid: ($) => $.dogs.photoInvalid,
  dogNameRequired: ($) => $.dogs.nameRequired,
  dogBirthDateInvalid: ($) => $.dogs.birthDateInvalid,
  dogBirthDateFuture: ($) => $.dogs.birthDateFuture,
  signInFailed: ($) => $.auth.errors.signIn,
  signUpFailed: ($) => $.auth.errors.signUp,
  resetFailed: ($) => $.auth.errors.reset,
  googleSignInFailed: ($) => $.auth.errors.google,
  emailTaken: ($) => $.auth.errors.emailTaken,
  invalidCredentials: ($) => $.auth.errors.invalidCredentials,
} satisfies Record<string, TranslationSelector>;

const selectorsByKey = new Map<string, TranslationSelector>(
  Object.values(messageSelectors).map((selector) => [
    keyFromSelector(selector),
    selector,
  ]),
);

export function translateMessage(t: TFunction, message: string): string {
  const selector = selectorsByKey.get(message);
  return selector ? t(selector) : message;
}
