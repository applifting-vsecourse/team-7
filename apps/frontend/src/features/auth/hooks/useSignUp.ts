import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ROUTES } from "@/app/routes";
import { messageSelectors } from "@/i18n/messages";
import { authKeys } from "@/lib/auth-keys";

import { authClient } from "@/features/auth/lib/auth-client";
import { authErrorMessage } from "@/features/auth/lib/auth-error";
import { toAbsoluteUrl } from "@/features/auth/lib/redirect";

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
};

export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SignUpInput) => {
      // BetterAuth handles the whole flow (and signs the user in by default)
      const { error } = await authClient.signUp.email({
        name: input.name,
        email: input.email,
        password: input.password,
        callbackURL: toAbsoluteUrl(ROUTES.overview),
      });
      if (error) {
        throw new Error(authErrorMessage(error, messageSelectors.signUpFailed));
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}
