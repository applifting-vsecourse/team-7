import { keyFromSelector } from "i18next";

import { messageSelectors, type TranslationSelector } from "@/i18n/messages";

// BetterAuth answers in English; known codes map to translated messages.
const messagesByCode: Record<string, TranslationSelector> = {
  USER_ALREADY_EXISTS: messageSelectors.emailTaken,
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: messageSelectors.emailTaken,
  INVALID_EMAIL_OR_PASSWORD: messageSelectors.invalidCredentials,
  INVALID_TOKEN: messageSelectors.resetLinkInvalid,
};

/** Returns a message key for a BetterAuth error, falling back for unknown codes. */
export function authErrorMessage(
  error: { code?: string },
  fallback: TranslationSelector,
): string {
  const selector = error.code ? messagesByCode[error.code] : undefined;
  return keyFromSelector(selector ?? fallback);
}
