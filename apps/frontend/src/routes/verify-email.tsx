import { Button } from "@heroui/react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import { AuthLayout } from "@/components/AuthLayout";

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions";
import { VerifyEmailPrompt } from "@/features/auth/components/VerifyEmailPrompt";
import { useSignOut } from "@/features/auth/hooks/useSignOut";
import {
  toNavigationOptions,
  verificationRedirect,
} from "@/features/auth/lib/redirect";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>): { from?: string } => ({
    from: typeof search.from === "string" ? search.from : undefined,
  }),
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.fetchQuery(
      authSessionQueryOptions(),
    );
    if (!session) throw redirect({ to: ROUTES.login });
    if (session.user.emailVerified) {
      throw redirect(toNavigationOptions(verificationRedirect(search.from)));
    }
  },
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { t } = useTranslation();
  const signOut = useSignOut();
  const { from } = Route.useSearch();

  return (
    <AuthLayout
      title={t(($) => $.auth.verifyEmail.title)}
      footer={
        <Button
          variant="ghost"
          isPending={signOut.isPending}
          isDisabled={signOut.isPending}
          onPress={() => signOut.mutate()}
        >
          {t(($) => $.auth.signOut)}
        </Button>
      }
    >
      <VerifyEmailPrompt redirectTo={verificationRedirect(from)} />
    </AuthLayout>
  );
}
