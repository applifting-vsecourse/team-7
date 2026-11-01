import { afterEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { Config } from "@/shared/config/config.service";
import { ResendAdapterFactory } from "./adapters/resend/resend.adapter.factory";
import { SMTPAdapterFactory } from "./adapters/smtp/smtp.adapter.factory";
import { createAdapter, redirectEmails } from "./mail.module";

describe("createAdapter", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses SMTP when configured without a Resend API key", () => {
    const adapter = { sendEmail: vi.fn() };
    const smtp = vi
      .spyOn(SMTPAdapterFactory, "create")
      .mockReturnValue(adapter);
    const resend = vi.spyOn(ResendAdapterFactory, "create");
    const config = mock<Config>({
      smtpHost: "smtp.example.com",
      smtpPort: 587,
      smtpSecure: false,
      smtpUsername: "mail@example.com",
      smtpPassword: "smtp-password",
      resendApiKey: undefined,
    });

    expect(createAdapter(config)).toBe(adapter);
    expect(smtp).toHaveBeenCalledExactlyOnceWith({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      user: "mail@example.com",
      pass: "smtp-password",
    });
    expect(resend).not.toHaveBeenCalled();
  });

  it("prefers Resend when both Resend and SMTP are configured", () => {
    const adapter = { sendEmail: vi.fn() };
    const smtp = vi.spyOn(SMTPAdapterFactory, "create");
    const resend = vi
      .spyOn(ResendAdapterFactory, "create")
      .mockReturnValue(adapter);
    const config = mock<Config>({
      smtpHost: "smtp.example.com",
      smtpPort: 587,
      smtpSecure: false,
      smtpUsername: "mail@example.com",
      smtpPassword: "smtp-password",
      resendApiKey: "resend-key",
      emailFrom: "TrainLoop <mail@example.com>",
    });

    expect(createAdapter(config)).toBe(adapter);
    expect(resend).toHaveBeenCalledExactlyOnceWith({
      apiKey: "resend-key",
      from: "TrainLoop <mail@example.com>",
    });
    expect(smtp).not.toHaveBeenCalled();
  });
});

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
