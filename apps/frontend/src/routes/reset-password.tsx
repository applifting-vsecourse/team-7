import { Alert, Link, toast } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import { AuthLayout } from "@/components/AuthLayout";

import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

// BetterAuth checks the emailed token and redirects here with `?token=` or
// `?error=INVALID_TOKEN`.
export const Route = createFileRoute("/reset-password")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { token?: string; error?: string } => ({
    token: typeof search.token === "string" ? search.token : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, error } = Route.useSearch();

  return (
    <AuthLayout
      title={t(($) => $.auth.newPassword.title)}
      backTo={ROUTES.login}
      footer={
        <Link href={ROUTES.login} className="font-medium text-foreground">
          {t(($) => $.auth.reset.back)}
        </Link>
      }
    >
      {token && !error ? (
        <div className="flex flex-col gap-6">
          <p className="text-base text-muted">
            {t(($) => $.auth.newPassword.description)}
          </p>
          <ResetPasswordForm
            token={token}
            onSuccess={async () => {
              toast.success(t(($) => $.auth.newPassword.success));
              await navigate({ to: ROUTES.login });
            }}
          />
        </div>
      ) : (
        <Alert status="danger" role="alert">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>
              {t(($) => $.auth.errors.resetLinkInvalid)}
            </Alert.Title>
            <Alert.Description>
              <Link
                href={ROUTES.forgotPassword}
                className="font-medium text-foreground"
              >
                {t(($) => $.auth.newPassword.requestNew)}
              </Link>
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}
    </AuthLayout>
  );
}
