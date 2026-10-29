import { Button } from "@heroui/react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import { AuthLayout } from "@/components/AuthLayout";

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions";
import { VerifyEmailPrompt } from "@/features/auth/components/VerifyEmailPrompt";
import { useSignOut } from "@/features/auth/hooks/useSignOut";

export const Route = createFileRoute("/verify-email")({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.fetchQuery(
      authSessionQueryOptions(),
    );
    if (!session) throw redirect({ to: ROUTES.login });
    if (session.user.emailVerified) throw redirect({ to: ROUTES.overview });
  },
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { t } = useTranslation();
  const signOut = useSignOut();

  return (
    <AuthLayout
      title={t(($) => $.auth.verifyEmail.title)}
      footer={
        <Button
          variant="ghost"
          size="sm"
          isPending={signOut.isPending}
          isDisabled={signOut.isPending}
          onPress={() => signOut.mutate()}
        >
          {t(($) => $.auth.signOut)}
        </Button>
      }
    >
      <VerifyEmailPrompt />
    </AuthLayout>
  );
}
