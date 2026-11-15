import { useEffect } from "react";
import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
  toast,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { keyFromSelector } from "i18next";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { z } from "zod";

import { messageSelectors, translateMessage } from "@/i18n/messages";

import { useChangePassword } from "@/features/auth/hooks/useChangePassword";
import { changePasswordSchema } from "@/features/settings/schemas/accountSettingsSchema";

import { SettingsError } from "./SettingsError";
import { SettingsSectionHeader } from "./SettingsSectionHeader";

export function PasswordSettings() {
  const { t } = useTranslation();
  const changePassword = useChangePassword();
  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      passwordConfirmation: "",
    },
  });
  const isPending = changePassword.isPending || form.formState.isSubmitting;
  const currentPasswordError = form.formState.errors.currentPassword;
  useEffect(() => {
    // Server errors arrive while the inputs are still disabled for submission.
    if (!isPending && currentPasswordError) form.setFocus("currentPassword");
  }, [isPending, currentPasswordError, form]);
  const fields = [
    { name: "currentPassword", label: t(($) => $.settings.currentPassword) },
    { name: "password", label: t(($) => $.settings.newPassword) },
    {
      name: "passwordConfirmation",
      label: t(($) => $.settings.confirmPassword),
    },
  ] as const;
  return (
    <Form
      aria-labelledby="password-heading"
      validationBehavior="aria"
      className="flex w-full flex-col items-start gap-6"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await changePassword.mutateAsync({
            currentPassword: values.currentPassword,
            newPassword: values.password,
          });
          form.reset();
          toast.success(t(($) => $.settings.passwordSaved));
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : keyFromSelector(messageSelectors.changePasswordFailed);
          if (
            message === keyFromSelector(messageSelectors.currentPasswordInvalid)
          ) {
            form.setError(
              "currentPassword",
              { message },
              { shouldFocus: true },
            );
          } else {
            form.setError("root", {
              message: keyFromSelector(messageSelectors.changePasswordFailed),
            });
          }
        }
      })}
    >
      <SettingsSectionHeader
        id="password-heading"
        title={t(($) => $.settings.changePassword)}
        description={t(($) => $.settings.passwordDescription)}
      />
      <div className="flex w-full flex-col gap-4">
        {fields.map(({ name, label }) => (
          <Controller
            key={name}
            control={form.control}
            name={name}
            render={({ field: { ref, ...field }, fieldState }) => (
              <TextField
                {...field}
                type="password"
                fullWidth
                isDisabled={isPending}
                isInvalid={fieldState.invalid}
              >
                <Label>{label}</Label>
                <Input
                  ref={ref}
                  variant="secondary"
                  autoComplete={
                    name === "currentPassword"
                      ? "current-password"
                      : "new-password"
                  }
                />
                {name === "password" && (
                  <Description>
                    {t(($) => $.auth.fields.passwordHint)}
                  </Description>
                )}
                <FieldError>
                  {fieldState.error?.message
                    ? translateMessage(t, fieldState.error.message)
                    : undefined}
                </FieldError>
              </TextField>
            )}
          />
        ))}
      </div>
      {form.formState.errors.root?.message && (
        <SettingsError>
          {translateMessage(t, form.formState.errors.root.message)}
        </SettingsError>
      )}
      <Button
        type="submit"
        variant="secondary"
        isDisabled={isPending}
        isPending={isPending}
        className="w-full sm:w-auto"
      >
        {t(($) => $.settings.changePassword)}
      </Button>
    </Form>
  );
}
