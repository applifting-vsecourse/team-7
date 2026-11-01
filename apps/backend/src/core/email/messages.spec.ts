import { describe, expect, it } from "vitest";
import { emailMessages } from "./messages";
import { renderEmail } from "./render";
import { ResetPassword } from "./templates/reset-password";
import { VerifyEmail } from "./templates/verify-email";

describe("localized auth emails", () => {
  it.each(["cs", "en"] as const)(
    "renders both email bodies in %s",
    async (language) => {
      const url =
        "http://localhost:4050/api/auth/verify-email?token=header.payload.signature&callbackURL=http%3A%2F%2Flocalhost%3A3050%2Foverview";
      const escapedUrl = url.replace(/&/g, "&amp;");
      const reset = await renderEmail(ResetPassword, {
        name: "Jana",
        url,
        language,
      });
      const verification = await renderEmail(VerifyEmail, { url, language });
      for (const [html, content] of [
        [reset, emailMessages[language].resetPassword],
        [verification, emailMessages[language].verifyEmail],
      ] as const) {
        expect(html).toContain(`lang="${language}"`);
        expect(html).toContain(content.heading);
        expect(html).toContain(content.button);
        expect(html).toContain(
          emailMessages[language].fallbackLink.replace(/'/g, "&#x27;"),
        );
        expect(html).toContain(`href="${escapedUrl}"`);
        // The fallback must be one explicit anchor, with the entire URL as
        // both its target and text, rather than relying on client auto-linking.
        const anchors = [
          ...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g),
        ];
        expect(
          anchors.some(
            ([, href, text]) => href === escapedUrl && text === escapedUrl,
          ),
        ).toBe(true);
      }
      expect(reset).toContain("Jana");
    },
  );
});
