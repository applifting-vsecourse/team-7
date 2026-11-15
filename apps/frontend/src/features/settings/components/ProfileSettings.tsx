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
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { z } from "zod";

import { translateMessage } from "@/i18n/messages";

import { type SessionUser } from "@/features/auth/api/authSessionQueryOptions";
import { useUpdateProfile } from "@/features/auth/hooks/useUpdateProfile";
import { usePendingEmailChange } from "@/features/settings/hooks/usePendingEmailChange";
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
  const updateProfile = useUpdateProfile(user.id);
  const { query: pendingQuery, cancel } = usePendingEmailChange(user.id);
  const [failed, setFailed] = useState(false);
  const pending = pendingQuery.data?.pendingEmailChange;
  const pendingEmail = pending?.email;
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: { name: user.name, email: user.email },
    resetOptions: { keepDirtyValues: true },
  });
  const isPending =
    form.formState.isSubmitting || updateProfile.isPending || cancel.isPending;
  return (
    <Form
      aria-labelledby="profile-heading"
      validationBehavior="aria"
      className="flex w-full flex-col items-start gap-6"
      onSubmit={form.handleSubmit(async (values) => {
        setFailed(false);
        try {
          const callback = new URL("/settings", window.location.origin);
          callback.searchParams.set("lng", i18n.resolvedLanguage ?? "cs");
          const result = await updateProfile.mutateAsync({
            name: values.name,
            newEmail:
              hasPassword &&
              values.email.toLowerCase() !== user.email.toLowerCase()
                ? values.email
                : undefined,
            callbackURL: callback.href,
          });
          if (result.requestedEmail) {
            toast.success(
              t(($) => $.settings.emailSent, { email: result.requestedEmail }),
            );
          } else {
            toast.success(t(($) => $.settings.profileSaved));
          }
          form.reset({ name: values.name, email: user.email });
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
        {pendingQuery.isError && (
          <div className="flex flex-col items-start gap-3">
            <SettingsError>
              {t(($) => $.settings.emailPendingLoadError)}
            </SettingsError>
            <Button
              variant="secondary"
              onPress={() => void pendingQuery.refetch()}
            >
              {t(($) => $.dogs.retry)}
            </Button>
          </div>
        )}
        {pending && pendingEmail !== user.email && (
          <Alert
            status="accent"
            role="status"
            className="flex-wrap sm:flex-nowrap"
          >
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>
                {t(($) => $.settings.emailPending, { email: pendingEmail })}
              </Alert.Title>
              <Alert.Description>
                {t(($) => $.settings.emailPendingDescription)}
              </Alert.Description>
            </Alert.Content>
            <Button
              type="button"
              variant="secondary"
              isPending={cancel.isPending}
              isDisabled={isPending}
              onPress={() =>
                cancel.mutate(pending.id, {
                  onSuccess: () =>
                    toast.success(t(($) => $.settings.emailChangeCancelled)),
                })
              }
            >
              {t(($) => $.settings.cancelEmailChange)}
            </Button>
          </Alert>
        )}
      </div>
      {cancel.isError && (
        <SettingsError>
          {t(($) => $.settings.emailChangeCancelError)}
        </SettingsError>
      )}
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
