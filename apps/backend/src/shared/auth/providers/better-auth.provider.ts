import { Inject, Logger, Provider } from "@nestjs/common";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { EmailService } from "@/core/email/interfaces/email-service.interface";
import { emailLanguageFromUrl, emailMessages } from "@/core/email/messages";
import { renderEmail } from "@/core/email/render";
import { ResetPassword } from "@/core/email/templates/reset-password";
import { VerifyEmail } from "@/core/email/templates/verify-email";
import { PrismaService } from "@/core/prisma/prisma.service";
import { betterAuthCoreConfig } from "@/shared/auth/config/better-auth.config";
import { Config } from "@/shared/config/config.service";
import { frontendOrigins } from "@/shared/config/frontend-origins";
import {
  createDefaultDisciplines,
  signUpLanguage,
} from "@/shared/domain/default-disciplines";

const createAuth = (
  prismaService: PrismaService,
  config: Config,
  emailProvider: EmailService,
) =>
  betterAuth({
    // Apply shared defaults first so they do not replace the email callbacks.
    ...betterAuthCoreConfig,
    // Without this better-auth can only guess its own URL from the request,
    // which breaks callbacks and links built outside a request (e.g. the seed).
    baseURL: config.backendUrl,
    database: prismaAdapter(prismaService, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
      revokeSessionsOnPasswordReset: true,
      // The link goes through BetterAuth, which checks the token and redirects
      // to the frontend's `redirectTo` with `?token=` or `?error=INVALID_TOKEN`.
      sendResetPassword: async ({ user, url }) => {
        // Relative callbacks otherwise resolve against the auth server.
        const resetUrl = new URL(url);
        const callback = resetUrl.searchParams.get("callbackURL");
        if (callback?.startsWith("/") && !callback.startsWith("//")) {
          resetUrl.searchParams.set(
            "callbackURL",
            new URL(callback, config.frontendUrl).href,
          );
        }
        const language = emailLanguageFromUrl(resetUrl.href);
        const html = await renderEmail(ResetPassword, {
          language,
          name: user.name,
          url: resetUrl.href,
        });
        await emailProvider.sendEmail(
          user.email,
          emailMessages[language].resetPassword.subject,
          html,
        );
      },
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: true,
          defaultValue: "user",
          input: false,
        },
      },
    },
    trustedOrigins: frontendOrigins(config),
    // Every new account starts with the default disciplines (#72), in the
    // language it signed up in. A failure leaves the account usable.
    databaseHooks: {
      user: {
        create: {
          after: async (user, context) => {
            const body = context?.body as { callbackURL?: unknown } | undefined;
            try {
              await createDefaultDisciplines(
                prismaService,
                user.id,
                signUpLanguage(body?.callbackURL),
              );
            } catch (error) {
              new Logger("BetterAuth").error(
                `Default disciplines for user ${user.id} failed`,
                error,
              );
            }
          },
        },
      },
    },
    // Google is enabled only when configured, so dev and CI run without it.
    socialProviders:
      config.googleClientId && config.googleClientSecret
        ? {
            google: {
              clientId: config.googleClientId,
              clientSecret: config.googleClientSecret,
              prompt: "select_account",
            },
          }
        : {},
    // Google verifies emails, so a matching password account is linked
    // instead of failing the sign-in.
    account: {
      accountLinking: { enabled: true, trustedProviders: ["google"] },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        const language = emailLanguageFromUrl(url);
        const html = await renderEmail(VerifyEmail, { url, language });
        await emailProvider.sendEmail(
          user.email,
          emailMessages[language].verifyEmail.subject,
          html,
        );
      },
      sendOnSignUp: true,
    },
    plugins: [...(betterAuthCoreConfig.plugins ?? [])],
  });

export type BetterAuth = ReturnType<typeof createAuth>;

export const betterAuthProvider: Provider = {
  provide: "BetterAuth",
  useFactory: (
    prismaService: PrismaService,
    config: Config,
    emailProvider: EmailService,
  ) => createAuth(prismaService, config, emailProvider),
  inject: [PrismaService, Config, "EmailService"],
};

export const InjectBetterAuth = Inject("BetterAuth");
