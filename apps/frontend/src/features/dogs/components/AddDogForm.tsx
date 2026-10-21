import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  TextField,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { keyFromSelector } from "i18next";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { messageSelectors, translateMessage } from "@/i18n/messages";

import { dogPhotoSchema } from "../schemas/dogPhotoSchema";
import { DogPhotoPicker } from "./DogPhotoPicker";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, keyFromSelector(messageSelectors.nameRequired)),
  photo: dogPhotoSchema.nullable(),
});

type AddDogValues = z.infer<typeof schema>;

export function AddDogForm({
  onSubmit,
  onCancel,
  isPending,
}: {
  onSubmit: (values: AddDogValues) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const form = useForm<AddDogValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", photo: null },
  });
  const isSubmitting = isPending || form.formState.isSubmitting;

  return (
    <Form
      validationBehavior="aria"
      onSubmit={form.handleSubmit(async (values) => {
        if (isSubmitting) return;
        try {
          await onSubmit(values);
        } catch {
          form.setError("root", { message: t(($) => $.dogs.addError) });
        }
      })}
    >
      <Modal.Body className="flex flex-col gap-5">
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
              <Label>{t(($) => $.dogs.name)}</Label>
              {/* The dialog opens on request, so focus the field for immediate typing. */}
              {/* oxlint-disable jsx-a11y/no-autofocus */}
              <Input ref={ref} autoFocus autoComplete="off" />
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
          name="photo"
          render={({ field, fieldState }) => (
            <DogPhotoPicker
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              name={field.name}
              isDisabled={isSubmitting}
              errorMessage={
                fieldState.error?.message
                  ? translateMessage(t, fieldState.error.message)
                  : undefined
              }
            />
          )}
        />
        {form.formState.errors.root ? (
          <p role="alert" className="text-sm text-danger">
            {t(($) => $.dogs.addError)}
          </p>
        ) : null}
      </Modal.Body>
      <Modal.Footer className="flex-col-reverse sm:flex-row">
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          isDisabled={isSubmitting}
          onPress={onCancel}
        >
          {t(($) => $.dogs.cancel)}
        </Button>
        <Button
          type="submit"
          className="w-full sm:w-auto"
          isPending={isSubmitting}
          isDisabled={isSubmitting}
        >
          {t(($) => $.navigation.addDog)}
        </Button>
      </Modal.Footer>
    </Form>
  );
}
