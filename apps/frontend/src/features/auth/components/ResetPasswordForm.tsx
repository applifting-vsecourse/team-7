import { useState } from "react";
import {
  Alert,
  Button,
  Description,
  FieldError,
  Form,
  Label,
  TextField,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { keyFromSelector } from "i18next";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { messageSelectors, translateMessage } from "@/i18n/messages";

import { authClient } from "@/features/auth/lib/auth-client";
import { authErrorMessage } from "@/features/auth/lib/auth-error";

import { PasswordInput } from "./PasswordInput";

const schema = z
  .object({
    password: z
      .string()
      .trim()
      .min(8, keyFromSelector(messageSelectors.passwordMinLength)),
    passwordConfirmation: z
      .string()
      .trim()
      .min(1, keyFromSelector(messageSelectors.passwordConfirmationRequired)),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: keyFromSelector(messageSelectors.passwordMismatch),
    path: ["passwordConfirmation"],
  });

type ResetPasswordFormProps = {
  token: string;
  onSuccess: () => void | Promise<void>;
};

export function ResetPasswordForm({
  token,
  onSuccess,
}: ResetPasswordFormProps) {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", passwordConfirmation: "" },
  });
  const isPending = form.formState.isSubmitting;

  return (
    <Form
      validationBehavior="aria"
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(async ({ password }) => {
        if (isPending) return;
        setErrorMessage(null);
        try {
          const { error } = await authClient.resetPassword({
            newPassword: password,
            token,
          });
          if (error) {
            throw new Error(
              authErrorMessage(error, messageSelectors.newPasswordFailed),
            );
          }
          await onSuccess();
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : keyFromSelector(messageSelectors.newPasswordFailed),
          );
        }
      })}
    >
      {errorMessage ? (
        <Alert status="danger" role="alert">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{translateMessage(t, errorMessage)}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      <Controller
        control={form.control}
        name="password"
        render={({ field: { ref, ...field }, fieldState }) => (
          <TextField
            {...field}
            fullWidth
            isInvalid={fieldState.invalid}
            isDisabled={isPending}
          >
            <Label>{t(($) => $.auth.fields.password)}</Label>
            <PasswordInput ref={ref} autoComplete="new-password" />
            <Description>{t(($) => $.auth.fields.passwordHint)}</Description>
            <FieldError>
              {fieldState.error?.message
                ? translateMessage(t, fieldState.error.message)
                : undefined}
            </FieldError>
          </TextField>
        )}
      />
      <Controller
        control={form.control}
        name="passwordConfirmation"
        render={({ field: { ref, ...field }, fieldState }) => (
          <TextField
            {...field}
            fullWidth
            isInvalid={fieldState.invalid}
            isDisabled={isPending}
          >
            <Label>{t(($) => $.auth.fields.confirmPassword)}</Label>
            <PasswordInput ref={ref} autoComplete="new-password" />
            <FieldError>
              {fieldState.error?.message
                ? translateMessage(t, fieldState.error.message)
                : undefined}
            </FieldError>
          </TextField>
        )}
      />
      <Button
        type="submit"
        fullWidth
        isPending={isPending}
        isDisabled={isPending}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        {t(($) => $.auth.newPassword.submit)}
      </Button>
    </Form>
  );
}
