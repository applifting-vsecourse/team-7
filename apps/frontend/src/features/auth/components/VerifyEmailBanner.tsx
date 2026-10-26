import { Alert, Button, toast } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
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

  return (
    <Alert status="warning" className="mx-4 mb-4 w-auto">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t(($) => $.auth.verifyEmail.title)}</Alert.Title>
        <Alert.Description>
          {t(($) => $.auth.verifyEmail.description, { email: user.email })}
        </Alert.Description>
      </Alert.Content>
      <Button
        size="sm"
        variant="secondary"
        isPending={resend.isPending}
        isDisabled={resend.isPending}
        onPress={() => resend.mutate(user.email)}
      >
        {t(($) => $.auth.verifyEmail.resend)}
      </Button>
    </Alert>
  );
}
