import { describe, expect, it, vi } from "vitest";
import { redirectEmails } from "./mail.module";

describe("redirectEmails", () => {
  it("sends to the redirect address and keeps the recipient in the subject", async () => {
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    await redirectEmails({ sendEmail }, "dev@example.com").sendEmail(
      "jana@example.com",
      "Verify your email address",
      "<p>hi</p>",
    );
    expect(sendEmail).toHaveBeenCalledExactlyOnceWith(
      "dev@example.com",
      "[jana@example.com] Verify your email address",
      "<p>hi</p>",
    );
  });
});
