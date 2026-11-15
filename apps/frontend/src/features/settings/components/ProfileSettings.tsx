import { useState } from "react";
import {
  Alert,
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
import { useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { z } from "zod";

import { translateMessage } from "@/i18n/messages";

import {
  authSessionQueryOptions,
  type SessionUser,
  type Session,
} from "@/features/auth/api/authSessionQueryOptions";
import { authClient } from "@/features/auth/lib/auth-client";
import { profileSchema } from "@/features/settings/schemas/accountSettingsSchema";

import { SettingsError } from "./SettingsError";
import { SettingsSectionHeader } from "./SettingsSectionHeader";

export function ProfileSettings({
  user,
  hasPassword,
}: {
  user: SessionUser;
  hasPassword: boolean;
}) {
  const { t, i18n } = useTranslation();
  const client = useQueryClient();
  const [failed, setFailed] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: { name: user.name, email: user.email },
    resetOptions: { keepDirtyValues: true },
  });
  const isPending = form.formState.isSubmitting;
  return (
    <Form
      aria-labelledby="profile-heading"
      validationBehavior="aria"
      className="flex w-full flex-col items-start gap-6"
      onSubmit={form.handleSubmit(async (values) => {
        setFailed(false);
        try {
          const nameResult = await authClient.updateUser({ name: values.name });
          if (nameResult.error) {
            setFailed(true);
            return;
          }
          // Persist the successful name even if sending the email link fails.
          client.setQueryData<Session>(
            authSessionQueryOptions().queryKey,
            (previous) =>
              previous
                ? { ...previous, user: { ...previous.user, name: values.name } }
                : previous,
          );
          if (
            hasPassword &&
            values.email.toLowerCase() !== user.email.toLowerCase()
          ) {
            const callback = new URL("/settings", window.location.origin);
            callback.searchParams.set("lng", i18n.resolvedLanguage ?? "cs");
            const result = await authClient.changeEmail({
              newEmail: values.email,
              callbackURL: callback.href,
            });
            if (result.error) {
              setFailed(true);
              return;
            }
            setPendingEmail(values.email);
            toast.success(
              t(($) => $.settings.emailSent, { email: values.email }),
            );
          } else {
            toast.success(t(($) => $.settings.profileSaved));
          }
          form.reset({ name: values.name, email: user.email });
          await client.invalidateQueries(authSessionQueryOptions());
        } catch {
          setFailed(true);
        }
      })}
    >
      <SettingsSectionHeader
        id="profile-heading"
        title={t(($) => $.settings.profile)}
        description={t(($) => $.settings.profileDescription)}
      />
      <div className="flex w-full flex-col gap-4">
        {(["name", "email"] as const).map((name) => (
          <Controller
            key={name}
            control={form.control}
            name={name}
            render={({ field: { ref, ...field }, fieldState }) => (
              <TextField
                {...field}
                type={name === "email" ? "email" : "text"}
                fullWidth
                isDisabled={isPending || (name === "email" && !hasPassword)}
                isInvalid={fieldState.invalid}
              >
                <Label>
                  {name === "name"
                    ? t(($) => $.auth.fields.name)
                    : t(($) => $.auth.fields.email)}
                </Label>
                <Input ref={ref} variant="secondary" autoComplete={name} />
                {name === "email" && (
                  <Description>
                    {hasPassword
                      ? t(($) => $.settings.emailHint)
                      : t(($) => $.settings.googleEmailHint)}
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
        {pendingEmail && pendingEmail !== user.email && (
          <Alert status="accent" role="status">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>
                {t(($) => $.settings.emailPending, { email: pendingEmail })}
              </Alert.Title>
              <Alert.Description>
                {t(($) => $.settings.emailPendingDescription)}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        )}
      </div>
      {failed && (
        <SettingsError>{t(($) => $.settings.profileError)}</SettingsError>
      )}
      <Button
        type="submit"
        isDisabled={isPending}
        isPending={isPending}
        className="w-full sm:w-auto"
      >
        {t(($) => $.settings.save)}
      </Button>
    </Form>
  );
}
