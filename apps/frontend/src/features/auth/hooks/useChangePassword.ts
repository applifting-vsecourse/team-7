import { useMutation } from "@tanstack/react-query";
import { keyFromSelector } from "i18next";

import { messageSelectors } from "@/i18n/messages";

import { authClient } from "@/features/auth/lib/auth-client";

type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      const { error } = await authClient.changePassword({
        ...input,
        revokeOtherSessions: true,
      });
      if (error) {
        throw new Error(
          keyFromSelector(
            error.code === "INVALID_PASSWORD"
              ? messageSelectors.currentPasswordInvalid
              : messageSelectors.changePasswordFailed,
          ),
        );
      }
    },
  });
}
