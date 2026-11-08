import {
  Alert,
  Button,
  Checkbox,
  Description,
  FieldError,
  Form,
  Label,
  toast,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { translateMessage } from "@/i18n/messages";

import {
  updateUserSettings,
  userSettingsQueryOptions,
} from "@/features/settings/api/userSettingsQueryOptions";
import {
  userSettingsSchema,
  type UserSettings,
} from "@/features/settings/schemas/userSettingsSchema";

export function SettingsContent({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const query = useQuery(userSettingsQueryOptions(userId));
  if (query.isPending) {
    return (
      <p role="status" className="text-sm text-muted">
        {t(($) => $.settings.loading)}
      </p>
    );
  }
  if (query.isError) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="text-sm text-danger">
          {t(($) => $.settings.loadError)}
        </p>
        <Button variant="secondary" onPress={() => void query.refetch()}>
          {t(($) => $.dogs.retry)}
        </Button>
      </div>
    );
  }
  return <SettingsForm userId={userId} settings={query.data} />;
}

function SettingsForm({
  userId,
  settings,
}: {
  userId: string;
  settings: UserSettings;
}) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const form = useForm<UserSettings>({
    resolver: zodResolver(userSettingsSchema),
    values: settings,
    resetOptions: { keepDirtyValues: true },
  });
  const mutation = useMutation({
    mutationFn: updateUserSettings,
    onSuccess: async (saved) => {
      form.reset(saved);
      const options = userSettingsQueryOptions(userId);
      client.setQueryData(options.queryKey, saved);
      await client.invalidateQueries({ queryKey: options.queryKey });
      toast.success(t(($) => $.settings.saved));
    },
  });
  const isPending = mutation.isPending || form.formState.isSubmitting;
  return (
    <Form
      aria-labelledby="notifications-heading"
      validationBehavior="aria"
      className="flex max-w-xl flex-col items-start gap-6"
      onSubmit={form.handleSubmit((values) => {
        if (!isPending) mutation.mutate(values);
      })}
    >
      <div className="flex flex-col gap-2">
        <h2
          id="notifications-heading"
          className="text-xl font-semibold tracking-tight"
        >
          {t(($) => $.settings.notifications)}
        </h2>
        <p className="text-sm text-muted">{t(($) => $.settings.description)}</p>
      </div>
      <Controller
        control={form.control}
        name="emailNotificationsEnabled"
        render={({ field, fieldState }) => (
          <Checkbox
            name={field.name}
            inputRef={field.ref}
            isSelected={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            isInvalid={fieldState.invalid}
            isDisabled={isPending}
          >
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Label>{t(($) => $.settings.emailNotifications)}</Label>
            </Checkbox.Content>
            <Description>
              {t(($) => $.settings.emailNotificationsDescription)}
            </Description>
            <FieldError>
              {fieldState.error?.message
                ? translateMessage(t, fieldState.error.message)
                : undefined}
            </FieldError>
          </Checkbox>
        )}
      />
      {mutation.isError && (
        <Alert status="danger" role="alert">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t(($) => $.settings.saveError)}</Alert.Title>
          </Alert.Content>
        </Alert>
      )}
      <Button type="submit" isPending={isPending} isDisabled={isPending}>
        {t(($) => $.settings.save)}
      </Button>
    </Form>
  );
}
