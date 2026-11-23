import { Inject, Provider } from "@nestjs/common";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { EmailService } from "@/core/email/interfaces/email-service.interface";
import { emailLanguageFromUrl, emailMessages } from "@/core/email/messages";
import { renderEmail } from "@/core/email/render";
import { EmailChangeNotice } from "@/core/email/templates/email-change-notice";
import { ResetPassword } from "@/core/email/templates/reset-password";
import { VerifyEmail } from "@/core/email/templates/verify-email";
import { PrismaService } from "@/core/prisma/prisma.service";
import { betterAuthCoreConfig } from "@/shared/auth/config/better-auth.config";
import { EmailChangeService } from "@/shared/auth/services/email-change.service";
import { Config } from "@/shared/config/config.service";
import { frontendOrigins } from "@/shared/config/frontend-origins";

const createAuth = (
  prismaService: PrismaService,
  config: Config,
  emailProvider: EmailService,
  emailChanges: EmailChangeService,
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
      ...betterAuthCoreConfig.user,
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
        const storedUser = await prismaService.user.findUnique({
          where: { id: user.id },
          select: { email: true },
        });
        let verificationUrl = url;
        if (
          storedUser &&
          storedUser.email.toLowerCase() !== user.email.toLowerCase()
        ) {
          const nativeUrl = new URL(url);
          const authToken = nativeUrl.searchParams.get("token");
          if (!authToken) throw new Error("Missing email verification token");
          const callback = new URL(
            nativeUrl.searchParams.get("callbackURL") || "/settings",
            config.frontendUrl,
          );
          if (!frontendOrigins(config).includes(callback.origin))
            throw new Error("Invalid email change callback origin");
          const secret = await emailChanges.issue({
            userId: user.id,
            originalEmail: storedUser.email,
            email: user.email,
            authToken,
            callbackUrl: callback.href,
            expiresAt: new Date(Date.now() + 60 * 60_000),
          });
          const link = new URL(
            "/api/users/email-change/confirm",
            config.backendUrl,
          );
          link.searchParams.set("token", secret);
          link.searchParams.set("lng", language);
          verificationUrl = link.href;
          // Notify the original owner before sending the confirmation link.
          const notice = await renderEmail(EmailChangeNotice, {
            email: user.email,
            url: callback.href,
            language,
          });
          await emailProvider.sendEmail(
            storedUser.email,
            emailMessages[language].emailChangeNotice.subject,
            notice,
          );
        }
        const html = await renderEmail(VerifyEmail, {
          url: verificationUrl,
          language,
        });
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
    emailChanges: EmailChangeService,
  ) => createAuth(prismaService, config, emailProvider, emailChanges),
  inject: [PrismaService, Config, "EmailService", EmailChangeService],
};

export const InjectBetterAuth = Inject("BetterAuth");
