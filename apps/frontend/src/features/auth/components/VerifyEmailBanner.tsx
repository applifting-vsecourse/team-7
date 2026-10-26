import { Alert, Button, toast } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";

import { useSession } from "@/features/auth/hooks/useSession";
import { authClient } from "@/features/auth/lib/auth-client";
import { toAbsoluteUrl } from "@/features/auth/lib/redirect";

export function VerifyEmailBanner() {
  const { t } = useTranslation();
  const { user } = useSession();
  const resend = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: toAbsoluteUrl(ROUTES.overview),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => toast.success(t(($) => $.auth.verifyEmail.sent)),
    onError: () => toast.danger(t(($) => $.auth.verifyEmail.failed)),
  });

  if (!user || user.emailVerified) return null;

  // Same gutters as <main>, so the notice lines up with the page below it.
  return (
    <div className="px-2 pb-2 sm:px-4 sm:pb-4">
      <Alert status="warning">
        <Alert.Indicator />
        {/* min-w-0 lets the content shrink and break a long email address
            instead of overflowing the alert. */}
        <Alert.Content className="min-w-0">
          <Alert.Title>{t(($) => $.auth.verifyEmail.title)}</Alert.Title>
          <Alert.Description className="wrap-break-word">
            {t(($) => $.auth.verifyEmail.description, { email: user.email })}
          </Alert.Description>
          {/* Under the text rather than beside it, so it never squeezes the
              message on a phone. */}
          <Button
            className="mt-3"
            size="sm"
            variant="secondary"
            isPending={resend.isPending}
            isDisabled={resend.isPending}
            onPress={() => resend.mutate(user.email)}
          >
            {resend.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {t(($) => $.auth.verifyEmail.resend)}
          </Button>
        </Alert.Content>
      </Alert>
    </div>
  );
}
