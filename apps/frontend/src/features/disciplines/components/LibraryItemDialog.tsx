import type { ReactNode } from "react";
import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  TextArea,
  TextField,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { translateMessage } from "@/i18n/messages";

import {
  libraryItemSchema,
  type LibraryItemValues,
} from "../schemas/libraryItemSchema";

export type LibraryItemLabels = {
  name: string;
  namePlaceholder: string;
  text: string;
  textPlaceholder: string;
};

type LibraryItemDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  // Sentence under the title, e.g. what happens after saving.
  description?: string;
  // "Discipline: Agility" line that says where the item is being added.
  context?: ReactNode;
  // Extra content under the fields, e.g. an informational alert.
  notice?: ReactNode;
  labels: LibraryItemLabels;
  submitLabel: string;
  defaultValues?: LibraryItemValues;
  isPending: boolean;
  onSubmit: (values: LibraryItemValues) => Promise<void>;
};

/** Create/edit dialog shared by disciplines, goals and exercises. */
export function LibraryItemDialog({
  isOpen,
  onOpenChange,
  title,
  isPending,
  ...formProps
}: LibraryItemDialogProps) {
  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (isPending) return;
        onOpenChange(open);
      }}
      isDismissable={!isPending}
      isKeyboardDismissDisabled={isPending}
    >
      <Modal.Container>
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{title}</Modal.Heading>
          </Modal.Header>
          {isOpen ? (
            <LibraryItemForm
              {...formProps}
              isPending={isPending}
              onCancel={() => onOpenChange(false)}
            />
          ) : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function LibraryItemForm({
  description,
  context,
  notice,
  labels,
  submitLabel,
  defaultValues = { name: "", text: "" },
  isPending,
  onSubmit,
  onCancel,
}: Omit<LibraryItemDialogProps, "isOpen" | "onOpenChange" | "title"> & {
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const form = useForm<LibraryItemValues>({
    resolver: zodResolver(libraryItemSchema),
    defaultValues,
  });
  const isSubmitting = isPending || form.formState.isSubmitting;
  const errorMessage = (message: string | undefined) =>
    message ? translateMessage(t, message) : undefined;

  return (
    <Form
      validationBehavior="aria"
      onSubmit={form.handleSubmit(async (values) => {
        if (isSubmitting) return;
        try {
          await onSubmit(values);
        } catch {
          form.setError("root", {
            message: t(($) => $.disciplines.saveError),
          });
        }
      })}
    >
      <Modal.Body className="flex flex-col gap-5">
        {description ? (
          <p className="text-sm leading-6 text-foreground">{description}</p>
        ) : null}
        {context}
        <Controller
          control={form.control}
          name="name"
          render={({ field: { ref, ...field }, fieldState }) => (
            <TextField
              {...field}
              isRequired
              isDisabled={isSubmitting}
              isInvalid={fieldState.invalid}
              fullWidth
            >
              <Label>{labels.name}</Label>
              {/* The dialog opens on request, so focus the field for immediate typing. */}
              {/* oxlint-disable jsx-a11y/no-autofocus */}
              <Input
                ref={ref}
                autoFocus
                autoComplete="off"
                placeholder={labels.namePlaceholder}
              />
              <FieldError>{errorMessage(fieldState.error?.message)}</FieldError>
            </TextField>
          )}
        />
        <Controller
          control={form.control}
          name="text"
          render={({ field: { ref, ...field }, fieldState }) => (
            <TextField
              {...field}
              isDisabled={isSubmitting}
              isInvalid={fieldState.invalid}
              fullWidth
            >
              <Label>{labels.text}</Label>
              <TextArea
                ref={ref}
                rows={4}
                placeholder={labels.textPlaceholder}
              />
              <FieldError>{errorMessage(fieldState.error?.message)}</FieldError>
            </TextField>
          )}
        />
        {notice}
        {form.formState.errors.root ? (
          <Description role="alert" className="text-danger">
            {form.formState.errors.root.message}
          </Description>
        ) : null}
      </Modal.Body>
      <Modal.Footer className="flex-col-reverse sm:flex-row">
        <Button
          variant="secondary"
          isDisabled={isSubmitting}
          onPress={onCancel}
          className="w-full sm:w-auto"
        >
          {t(($) => $.disciplines.cancel)}
        </Button>
        <Button
          type="submit"
          isPending={isSubmitting}
          isDisabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {submitLabel}
        </Button>
      </Modal.Footer>
    </Form>
  );
}
