import { useState } from "react";
import { Link } from "@heroui/react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { keyFromSelector } from "i18next";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import { AuthLayout } from "@/components/AuthLayout";
import { messageSelectors } from "@/i18n/messages";

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions";
import { SignUpForm } from "@/features/auth/components/SignUpForm";
import { useSignUp } from "@/features/auth/hooks/useSignUp";

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(
      authSessionQueryOptions(),
    );
    if (!session) return;
    throw redirect({ to: ROUTES.quacks });
  },
});

function SignUpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signUp = useSignUp();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (values: {
    email: string;
    name: string;
    username: string;
    password: string;
  }) => {
    setErrorMessage(null);
    try {
      await signUp.mutateAsync({
        email: values.email,
        password: values.password,
        name: values.name,
        username: values.username,
      });
      await navigate({ to: ROUTES.quacks });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : keyFromSelector(messageSelectors.signUpFailed),
      );
    }
  };

  return (
    <AuthLayout
      title={t(($) => $.auth.signUp)}
      footer={
        <>
          {t(($) => $.auth.existingAccount)}{" "}
          <Link href={ROUTES.login} className="font-medium text-foreground">
            {t(($) => $.auth.signIn)}
          </Link>
        </>
      }
    >
      <SignUpForm
        isLoading={signUp.isPending}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
      />
    </AuthLayout>
  );
}
