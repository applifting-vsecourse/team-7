import { Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions";
import { userAccountsQueryOptions } from "@/features/settings/api/userSettingsQueryOptions";

import { DeleteAccountSettings } from "./DeleteAccountSettings";
import { PasswordSettings } from "./PasswordSettings";
import { ProfileSettings } from "./ProfileSettings";
import { SettingsContent } from "./SettingsContent";

export function AccountSettings({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const session = useQuery(authSessionQueryOptions());
  const accounts = useQuery(userAccountsQueryOptions(userId));
  if (session.isPending || accounts.isPending) {
    return (
      <p role="status" className="text-sm text-muted">
        {t(($) => $.settings.loading)}
      </p>
    );
  }
  if (session.isError || accounts.isError || !session.data) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="text-sm text-danger">
          {t(($) => $.settings.accountsError)}
        </p>
        <Button
          variant="secondary"
          onPress={() => {
            void session.refetch();
            void accounts.refetch();
          }}
        >
          {t(($) => $.dogs.retry)}
        </Button>
      </div>
    );
  }
  const hasPassword = accounts.data.some(
    (account) => account.providerId === "credential",
  );
  return (
    <div className="flex w-full max-w-settings flex-col gap-12">
      <ProfileSettings user={session.data.user} hasPassword={hasPassword} />
      {hasPassword && <PasswordSettings />}
      <SettingsContent userId={userId} />
      <DeleteAccountSettings
        userId={userId}
        email={session.data.user.email}
        hasPassword={hasPassword}
      />
    </div>
  );
}
