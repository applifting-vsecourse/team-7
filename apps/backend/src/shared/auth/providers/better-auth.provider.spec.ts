import { type FactoryProvider } from "@nestjs/common";
import { betterAuth } from "better-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock, mockDeep } from "vitest-mock-extended";
import { EmailService } from "@/core/email/interfaces/email-service.interface";
import { emailMessages } from "@/core/email/messages";
import { renderEmail } from "@/core/email/render";
import { EmailChangeNotice } from "@/core/email/templates/email-change-notice";
import { ResetPassword } from "@/core/email/templates/reset-password";
import { VerifyEmail } from "@/core/email/templates/verify-email";
import { PrismaService } from "@/core/prisma/prisma.service";
import { EmailChangeService } from "@/shared/auth/services/email-change.service";
import { Config } from "@/shared/config/config.service";
import { betterAuthProvider } from "./better-auth.provider";

vi.mock("better-auth", () => ({ betterAuth: vi.fn() }));
vi.mock("@/core/email/render", () => ({
  renderEmail: vi.fn().mockResolvedValue("<p>email</p>"),
}));

describe("auth email callbacks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("emails a revocable link for email changes and keeps the BetterAuth token private", async () => {
    const prisma = mockDeep<PrismaService>();
    prisma.user.findUnique.mockResolvedValue({
      email: "old@example.com",
    } as never);
    const changes = mock<EmailChangeService>();
    changes.issue.mockResolvedValue("s".repeat(43));
    const email = mock<EmailService>();
    (betterAuthProvider as FactoryProvider).useFactory(
      prisma,
      mock<Config>({
        frontendUrl: "https://trainloop.example.com",
        backendUrl: "https://api.example.com",
        additionalFrontendOrigins: "",
      }),
      email,
      changes,
    );
    const options = vi.mocked(betterAuth).mock.calls[0]![0]!;
    const url = new URL("https://api.example.com/api/auth/verify-email");
    url.searchParams.set("token", "private-token");
    url.searchParams.set(
      "callbackURL",
      "https://trainloop.example.com/settings?lng=cs",
    );
    await options.emailVerification!.sendVerificationEmail!({
      user: {
        id: "owner",
        name: "Jana",
        email: "new@example.com",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      url: url.href,
      token: "private-token",
    });
    expect(renderEmail).toHaveBeenCalledWith(EmailChangeNotice, {
      email: "new@example.com",
      url: "https://trainloop.example.com/settings?lng=cs",
      language: "cs",
    });
    expect(email.sendEmail).toHaveBeenNthCalledWith(
      1,
      "old@example.com",
      emailMessages.cs.emailChangeNotice.subject,
      "<p>email</p>",
    );
    expect(changes.issue).toHaveBeenCalledWith({
      userId: "owner",
      originalEmail: "old@example.com",
      email: "new@example.com",
      authToken: "private-token",
      callbackUrl: "https://trainloop.example.com/settings?lng=cs",
      expiresAt: expect.any(Date),
    });
    const props = vi
      .mocked(renderEmail)
      .mock.calls.find(([template]) => template === VerifyEmail)![1] as {
      url: string;
    };
    const link = new URL(props.url);
    expect(link.pathname).toBe("/api/users/email-change/confirm");
    expect(link.searchParams.get("token")).toBe("s".repeat(43));
    expect(link.searchParams.get("lng")).toBe("cs");
    expect(props.url).not.toContain("private-token");
    expect(email.sendEmail).toHaveBeenCalledWith(
      "new@example.com",
      expect.any(String),
      "<p>email</p>",
    );
  });

  it.each([1, 2])(
    "discards the issued email change when email %i of 2 fails to send",
    async (failing) => {
      const prisma = mockDeep<PrismaService>();
      prisma.user.findUnique.mockResolvedValue({
        email: "old@example.com",
      } as never);
      const changes = mock<EmailChangeService>();
      changes.issue.mockResolvedValue("s".repeat(43));
      const email = mock<EmailService>();
      let sent = 0;
      email.sendEmail.mockImplementation(async () => {
        if (++sent === failing) throw new Error("offline");
      });
      (betterAuthProvider as FactoryProvider).useFactory(
        prisma,
        mock<Config>({
          frontendUrl: "https://trainloop.example.com",
          backendUrl: "https://api.example.com",
          additionalFrontendOrigins: "",
        }),
        email,
        changes,
      );
      const options = vi.mocked(betterAuth).mock.calls[0]![0]!;
      const url = new URL("https://api.example.com/api/auth/verify-email");
      url.searchParams.set("token", "private-token");
      await expect(
        options.emailVerification!.sendVerificationEmail!({
          user: {
            id: "owner",
            name: "Jana",
            email: "new@example.com",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          url: url.href,
          token: "private-token",
        }),
      ).rejects.toThrow("offline");
      expect(changes.discard).toHaveBeenCalledWith("owner", "s".repeat(43));
    },
  );

  it("resolves a relative reset callback against FRONTEND_URL and keeps the language", async () => {
    const email = mock<EmailService>();
    (betterAuthProvider as FactoryProvider).useFactory(
      mockDeep<PrismaService>(),
      mock<Config>({
        frontendUrl: "https://trainloop.example.com",
        additionalFrontendOrigins: "",
        backendUrl: "https://api.example.com",
      }),
      email,
    );
    const options = vi.mocked(betterAuth).mock.calls[0]![0]!;
    const url = new URL(
      "https://api.example.com/api/auth/reset-password/token",
    );
    url.searchParams.set("callbackURL", "/reset-password?lng=cs");
    await options.emailAndPassword!.sendResetPassword!({
      user: {
        id: "u",
        name: "Jana",
        email: "jana@example.com",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      url: url.href,
      token: "token",
    });
    const props = vi.mocked(renderEmail).mock.calls[0]![1] as { url: string };
    const link = new URL(props.url);
    expect(link.origin).toBe("https://api.example.com");
    expect(link.pathname).toBe("/api/auth/reset-password/token");
    expect(link.searchParams.get("callbackURL")).toBe(
      "https://trainloop.example.com/reset-password?lng=cs",
    );
    expect(email.sendEmail).toHaveBeenCalledWith(
      "jana@example.com",
      "Obnovení hesla",
      "<p>email</p>",
    );
  });

  it.each([
    [undefined, "cs"],
    ["cs", "cs"],
    ["en", "en"],
    ["de", "cs"],
  ] as const)(
    "uses matching email subjects and templates for lng=%s",
    async (lng, language) => {
      const email = mock<EmailService>();
      (betterAuthProvider as FactoryProvider).useFactory(
        mockDeep<PrismaService>(),
        mock<Config>({
          frontendUrl: "https://trainloop.example.com",
          additionalFrontendOrigins: "https://preview.example.com",
          backendUrl: "https://api.example.com",
        }),
        email,
      );
      const options = vi.mocked(betterAuth).mock.calls[0]![0]!;
      expect(options.trustedOrigins).toEqual([
        "https://trainloop.example.com",
        "https://preview.example.com",
      ]);
      const user = {
        id: "u",
        name: "Jana",
        email: "jana@example.com",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const callback = new URL("https://trainloop.example.com/overview");
      if (lng) callback.searchParams.set("lng", lng);
      const link = new URL("https://api.example.com/api/auth/verify-email");
      link.searchParams.set("callbackURL", callback.href);
      await options.emailVerification!.sendVerificationEmail!({
        user,
        url: link.href,
        token: "token",
      });
      expect(renderEmail).toHaveBeenLastCalledWith(VerifyEmail, {
        url: link.href,
        language,
      });
      expect(email.sendEmail).toHaveBeenLastCalledWith(
        user.email,
        emailMessages[language].verifyEmail.subject,
        "<p>email</p>",
      );
      await options.emailAndPassword!.sendResetPassword!({
        user,
        url: link.href,
        token: "token",
      });
      expect(renderEmail).toHaveBeenLastCalledWith(ResetPassword, {
        url: link.href,
        name: user.name,
        language,
      });
      expect(email.sendEmail).toHaveBeenLastCalledWith(
        user.email,
        emailMessages[language].resetPassword.subject,
        "<p>email</p>",
      );
    },
  );
});

it("starts new accounts with an empty library (they pick from the catalog)", () => {
  vi.clearAllMocks();
  (betterAuthProvider as FactoryProvider).useFactory(
    mockDeep<PrismaService>(),
    mock<Config>({
      frontendUrl: "http://localhost:3050",
      additionalFrontendOrigins: "",
    }),
    mock<EmailService>(),
  );
  expect(
    vi.mocked(betterAuth).mock.calls[0]![0]!.databaseHooks,
  ).toBeUndefined();
});
