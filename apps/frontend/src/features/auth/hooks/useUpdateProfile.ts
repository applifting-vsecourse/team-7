import { useMutation, useQueryClient } from "@tanstack/react-query";
import { keyFromSelector } from "i18next";

import { messageSelectors } from "@/i18n/messages";

import {
  authSessionQueryOptions,
  type Session,
} from "@/features/auth/api/authSessionQueryOptions";
import { authClient } from "@/features/auth/lib/auth-client";
import { pendingEmailChangeQueryOptions } from "@/features/settings/api/pendingEmailChangeQueryOptions";

type UpdateProfileInput = {
  name: string;
  newEmail?: string;
  callbackURL: string;
};

export function useUpdateProfile(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, newEmail, callbackURL }: UpdateProfileInput) => {
      const result = await authClient.updateUser({ name });
      if (result.error) {
        throw new Error(keyFromSelector(messageSelectors.profileUpdateFailed));
      }
      client.setQueryData<Session>(
        authSessionQueryOptions().queryKey,
        (previous) =>
          previous
            ? { ...previous, user: { ...previous.user, name } }
            : previous,
      );
      if (newEmail) {
        const changed = await authClient.changeEmail({ newEmail, callbackURL });
        if (changed.error) {
          throw new Error(
            keyFromSelector(messageSelectors.profileUpdateFailed),
          );
        }
      }
      return { requestedEmail: newEmail ?? null };
    },
    onSettled: async () => {
      await Promise.all([
        client.invalidateQueries(authSessionQueryOptions()),
        client.invalidateQueries({
          queryKey: pendingEmailChangeQueryOptions(userId).queryKey,
        }),
      ]);
    },
  });
}
