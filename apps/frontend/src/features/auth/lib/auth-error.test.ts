import { describe, expect, it } from "vitest";

import { messageSelectors } from "@/i18n/messages";

import { authErrorMessage } from "./auth-error";

describe("auth error messages", () => {
  it("translates a taken email instead of showing BetterAuth's English text", () => {
    expect(
      authErrorMessage(
        { code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" },
        messageSelectors.signUpFailed,
      ),
    ).toBe("auth.errors.emailTaken");
  });

  it("translates invalid credentials", () => {
    expect(
      authErrorMessage(
        { code: "INVALID_EMAIL_OR_PASSWORD" },
        messageSelectors.signInFailed,
      ),
    ).toBe("auth.errors.invalidCredentials");
  });

  it("falls back for unknown or missing codes", () => {
    expect(
      authErrorMessage(
        { code: "SOMETHING_ELSE" },
        messageSelectors.signUpFailed,
      ),
    ).toBe("auth.errors.signUp");
    expect(authErrorMessage({}, messageSelectors.signInFailed)).toBe(
      "auth.errors.signIn",
    );
  });
});
