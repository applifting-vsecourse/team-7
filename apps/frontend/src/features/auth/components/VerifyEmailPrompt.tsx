import { ArrowRotateRight } from "@gravity-ui/icons";
import { Button, toast } from "@heroui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Navigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions";
import { authClient } from "@/features/auth/lib/auth-client";
import {
  toAbsoluteUrl,
  toNavigationOptions,
} from "@/features/auth/lib/redirect";

export function VerifyEmailPrompt({
  redirectTo = ROUTES.overview,
}: {
  redirectTo?: string;
}) {
  const { t } = useTranslation();
  // The link is usually opened in another tab; coming back here rechecks the
  // session and lets the user in once the email is verified.
  const { data } = useQuery({
    ...authSessionQueryOptions(),
    refetchOnWindowFocus: "always",
  });
  const resend = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: toAbsoluteUrl(redirectTo),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => toast.success(t(($) => $.auth.verifyEmail.sent)),
    onError: () => toast.danger(t(($) => $.auth.verifyEmail.failed)),
  });

  const user = data?.user;
  if (!user) return <Navigate to={ROUTES.login} />;
  if (user.emailVerified) {
    return <Navigate {...toNavigationOptions(redirectTo)} />;
  }

  return (
    <>
      <p className="text-center text-base leading-7 wrap-break-word text-muted">
        {t(($) => $.auth.verifyEmail.description, { email: user.email })}
      </p>
      <Button
        size="lg"
        fullWidth
        isPending={resend.isPending}
        isDisabled={resend.isPending}
        onPress={() => resend.mutate(user.email)}
      >
        {resend.isPending ? (
          <ArrowRotateRight
            className="size-4 animate-spin"
            aria-hidden="true"
          />
        ) : null}
        {t(($) => $.auth.verifyEmail.resend)}
      </Button>
    </>
  );
}
