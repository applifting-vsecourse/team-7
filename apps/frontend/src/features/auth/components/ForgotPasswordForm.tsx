import { useState } from "react";
import {
  Alert,
  Button,
  FieldError,
  Form,
  Input,
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

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, keyFromSelector(messageSelectors.emailRequired))
    .email(keyFromSelector(messageSelectors.emailInvalid)),
});

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });
  const isPending = form.formState.isSubmitting;

  return (
    <Form
      validationBehavior="aria"
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(async ({ email }) => {
        if (isPending) return;
        setErrorMessage(null);
        setSent(false);
        try {
          const { error } = await authClient.requestPasswordReset({ email });
          if (error) {
            throw new Error(
              error.message ?? keyFromSelector(messageSelectors.resetFailed),
            );
          }
          setSent(true);
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : keyFromSelector(messageSelectors.resetFailed),
          );
        }
      })}
    >
      {sent ? (
        <Alert status="success" role="status">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t(($) => $.auth.reset.confirmation)}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
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
        name="email"
        render={({ field: { ref, ...field }, fieldState }) => (
          <TextField
            {...field}
            type="email"
            fullWidth
            isInvalid={fieldState.invalid}
            isDisabled={isPending}
          >
            <Label>{t(($) => $.auth.fields.email)}</Label>
            <Input
              ref={ref}
              autoComplete="email"
              placeholder={t(($) => $.auth.fields.emailPlaceholder)}
            />
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
        {t(($) => $.auth.reset.submit)}
      </Button>
    </Form>
  );
}
