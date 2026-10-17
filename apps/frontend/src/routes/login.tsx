import { useState } from "react";
import { Link } from "@heroui/react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { keyFromSelector } from "i18next";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { ROUTES } from "@/app/routes";
import { AuthLayout } from "@/components/AuthLayout";
import { messageSelectors } from "@/i18n/messages";

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { useSignIn } from "@/features/auth/hooks/useSignIn";
import { decodeRedirectUri } from "@/features/auth/lib/redirect";

const loginSearchParamsSchema = z.object({
  from: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: loginSearchParamsSchema,
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(
      authSessionQueryOptions(),
    );
    if (!session) return;
    throw redirect({ to: ROUTES.overview });
  },
});

function LoginPage() {
  const { t } = useTranslation();
  const { from } = Route.useSearch();
  const redirectTo = from ? decodeRedirectUri(from) : ROUTES.overview;
  const navigate = useNavigate();
  const signIn = useSignIn();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (values: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => {
    setErrorMessage(null);
    try {
      await signIn.mutateAsync(values);
      await navigate({ to: redirectTo });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : keyFromSelector(messageSelectors.signInFailed),
      );
    }
  };

  return (
    <AuthLayout
      title={t(($) => $.auth.signInTitle)}
      footer={
        <>
          {t(($) => $.auth.noAccount)}{" "}
          <Link href={ROUTES.signup} className="font-medium text-foreground">
            {t(($) => $.auth.signUp)}
          </Link>
        </>
      }
    >
      <SignInForm
        isLoading={signIn.isPending}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
      />
    </AuthLayout>
  );
}
