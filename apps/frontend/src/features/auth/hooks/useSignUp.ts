import { useMutation, useQueryClient } from "@tanstack/react-query";

import { messageSelectors } from "@/i18n/messages";
import { authKeys } from "@/lib/auth-keys";

import { authClient } from "@/features/auth/lib/auth-client";
import { authErrorMessage } from "@/features/auth/lib/auth-error";

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
