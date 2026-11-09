import { type FactoryProvider } from "@nestjs/common";
import { betterAuth } from "better-auth";
import { getOAuthState } from "better-auth/api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { EmailService } from "@/core/email/interfaces/email-service.interface";
import { emailMessages } from "@/core/email/messages";
import { renderEmail } from "@/core/email/render";
import { ResetPassword } from "@/core/email/templates/reset-password";
import { VerifyEmail } from "@/core/email/templates/verify-email";
import { PrismaService } from "@/core/prisma/prisma.service";
import { Config } from "@/shared/config/config.service";
import { betterAuthProvider } from "./better-auth.provider";

vi.mock("better-auth", () => ({ betterAuth: vi.fn() }));
vi.mock("better-auth/api", () => ({ getOAuthState: vi.fn() }));
vi.mock("@/core/email/render", () => ({
  renderEmail: vi.fn().mockResolvedValue("<p>email</p>"),
}));

describe("auth email callbacks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolves a relative reset callback against FRONTEND_URL and keeps the language", async () => {
    const email = mock<EmailService>();
    (betterAuthProvider as FactoryProvider).useFactory(
      mock<PrismaService>(),
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
        mock<PrismaService>(),
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

describe("new accounts", () => {
  beforeEach(() => vi.clearAllMocks());

  const createUserHook = (prisma: PrismaService) => {
    (betterAuthProvider as FactoryProvider).useFactory(
      prisma,
      mock<Config>({
        frontendUrl: "http://localhost:3050",
        additionalFrontendOrigins: "",
        backendUrl: "http://localhost:4050",
      }),
      mock<EmailService>(),
    );
    const options = vi.mocked(betterAuth).mock.calls[0]![0]!;
    return options.databaseHooks!.user!.create!.after!;
  };
  const user = {
    id: "user-new",
    name: "Jana",
    email: "jana@example.com",
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const fakePrisma = (create: ReturnType<typeof vi.fn>) => {
    const tx = { discipline: { create } };
    return {
      $transaction: (run: (client: typeof tx) => unknown) => run(tx),
    } as never as PrismaService;
  };

  it("start with the default disciplines in the language they signed up in", async () => {
    const create = vi.fn();
    const after = createUserHook(fakePrisma(create));

    await after(user, {
      body: { callbackURL: "http://localhost:3050/overview?lng=en" },
    } as never);

    expect(create).toHaveBeenCalledTimes(5);
    expect(create.mock.calls[0]![0].data).toMatchObject({
      userId: "user-new",
      name: "Obedience basics",
    });
  });

  it("signing up with Google get the language from the OAuth state", async () => {
    // The account is created in the provider's callback, which has no body.
    vi.mocked(getOAuthState).mockResolvedValue({
      callbackURL: "http://localhost:3050/overview?lng=en",
    } as never);
    const create = vi.fn();
    const after = createUserHook(fakePrisma(create));

    await after(user, { query: { state: "s" } } as never);

    expect(create.mock.calls[0]![0].data).toMatchObject({
      name: "Obedience basics",
    });
  });

  it("keep a working account when the defaults fail", async () => {
    const create = vi.fn().mockRejectedValue(new Error("db down"));
    const after = createUserHook(fakePrisma(create));

    await expect(after(user, null)).resolves.toBeUndefined();
  });
});
