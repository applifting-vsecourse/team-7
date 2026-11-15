import { useState } from "react";
import { TrashBin } from "@gravity-ui/icons";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  TextField,
  toast,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { z } from "zod";

import { translateMessage } from "@/i18n/messages";

import { authClient } from "@/features/auth/lib/auth-client";
import { accountSummaryQueryOptions } from "@/features/settings/api/userSettingsQueryOptions";
import { deleteAccountSchema } from "@/features/settings/schemas/accountSettingsSchema";

import { SettingsError } from "./SettingsError";
import { SettingsSectionHeader } from "./SettingsSectionHeader";

export function DeleteAccountSettings({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  return (
    <section
      aria-labelledby="delete-account-heading"
      className="flex w-full flex-col items-start gap-6"
    >
      <SettingsSectionHeader
        id="delete-account-heading"
        title={t(($) => $.settings.deleteHeading)}
        description={t(($) => $.settings.deleteDescription)}
      />
      <Button
        variant="danger-soft"
        className="w-full sm:w-auto"
        onPress={() => setOpen(true)}
      >
        <TrashBin className="size-4" aria-hidden="true" />
        {t(($) => $.settings.deleteAccount)}
      </Button>
      {isOpen && (
        <DeleteAccountDialog
          userId={userId}
          email={email}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}

function DeleteAccountDialog({
  userId,
  email,
  onClose,
}: {
  userId: string;
  email: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const summary = useQuery(accountSummaryQueryOptions(userId));
  const [failed, setFailed] = useState(false);
  const [reauthenticate, setReauthenticate] = useState(false);
  const [isSigningOut, setSigningOut] = useState(false);
  const form = useForm<z.infer<typeof deleteAccountSchema>>({
    resolver: zodResolver(deleteAccountSchema),
  });
  const isPending = form.formState.isSubmitting || isSigningOut;
  return (
    <Modal.Backdrop
      isOpen
      isDismissable={!isPending}
      isKeyboardDismissDisabled={isPending}
      onOpenChange={(open) => {
        if (!open && !isPending) onClose();
      }}
    >
      <Modal.Container size="lg" scroll="outside">
        <Modal.Dialog data-delete-confirmation>
          <Modal.CloseTrigger
            isDisabled={isPending}
            aria-label={t(($) => $.settings.cancel)}
          />
          <Modal.Header>
            <Modal.Icon className="bg-default text-danger">
              <TrashBin className="size-5" aria-hidden="true" />
            </Modal.Icon>
            <Modal.Heading>{t(($) => $.settings.deleteTitle)}</Modal.Heading>
          </Modal.Header>
          <Form
            validationBehavior="aria"
            onSubmit={form.handleSubmit(async () => {
              if (!summary.data) return;
              setFailed(false);
              try {
                const { error } = await authClient.deleteUser();
                if (error) {
                  if (error.code === "SESSION_EXPIRED") setReauthenticate(true);
                  else setFailed(true);
                  return;
                }
                client.clear();
                toast.success(t(($) => $.settings.deleted));
                await navigate({ to: "/login" });
              } catch {
                setFailed(true);
              }
            })}
          >
            <Modal.Body className="flex flex-col gap-4">
              <p>{t(($) => $.settings.deleteBody, { email })}</p>
              {summary.isPending && (
                <p role="status" className="text-sm text-muted">
                  {t(($) => $.settings.summaryLoading)}
                </p>
              )}
              {summary.isError && (
                <div className="flex flex-col items-start gap-3">
                  <SettingsError>
                    {t(($) => $.settings.summaryError)}
                  </SettingsError>
                  <Button
                    variant="secondary"
                    onPress={() => void summary.refetch()}
                  >
                    {t(($) => $.dogs.retry)}
                  </Button>
                </div>
              )}
              {summary.data && (
                <ul className="flex list-disc flex-col gap-1 pl-5">
                  <li>
                    {t(($) => $.settings.deleteDogs, {
                      count: summary.data.dogs,
                    })}
                  </li>
                  <li>
                    {t(($) => $.settings.deleteDisciplines, {
                      count: summary.data.disciplines,
                    })}
                  </li>
                  <li>
                    {t(($) => $.settings.deleteExercises, {
                      count: summary.data.exercises,
                    })}
                  </li>
                  <li>
                    {t(($) => $.settings.deleteVideos, {
                      count: summary.data.videos,
                    })}
                  </li>
                </ul>
              )}
              <Controller
                control={form.control}
                name="confirmation"
                render={({ field: { ref, ...field }, fieldState }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    fullWidth
                    isDisabled={isPending}
                    isInvalid={fieldState.invalid}
                  >
                    <Label>{t(($) => $.settings.deleteConfirmation)}</Label>
                    <Input
                      ref={ref}
                      autoComplete="off"
                      placeholder={t(($) => $.settings.deletePlaceholder)}
                    />
                    <FieldError>
                      {fieldState.error?.message
                        ? translateMessage(t, fieldState.error.message)
                        : undefined}
                    </FieldError>
                  </TextField>
                )}
              />
              {failed && (
                <SettingsError>
                  {t(($) => $.settings.deleteError)}
                </SettingsError>
              )}
              {reauthenticate && (
                <SettingsError>
                  {t(($) => $.settings.deleteReauthenticate)}
                </SettingsError>
              )}
            </Modal.Body>
            <Modal.Footer className="flex-wrap">
              <Button
                variant="secondary"
                className="flex-auto sm:flex-none"
                isDisabled={isPending}
                onPress={onClose}
              >
                {t(($) => $.settings.cancel)}
              </Button>
              {reauthenticate ? (
                <Button
                  variant="secondary"
                  className="flex-auto sm:flex-none"
                  isDisabled={isPending}
                  onPress={async () => {
                    setSigningOut(true);
                    try {
                      const result = await authClient.signOut();
                      if (result.error) {
                        setFailed(true);
                        return;
                      }
                      client.clear();
                      await navigate({
                        to: "/login",
                        search: { from: "/settings" },
                      });
                    } catch {
                      setFailed(true);
                    } finally {
                      setSigningOut(false);
                    }
                  }}
                >
                  {t(($) => $.settings.signInAgain)}
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="danger"
                  className="flex-auto sm:flex-none"
                  isDisabled={isPending || !summary.data}
                  isPending={isPending}
                >
                  {t(($) => $.settings.deleteAccount)}
                </Button>
              )}
            </Modal.Footer>
          </Form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
