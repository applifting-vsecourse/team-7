import { useState } from "react";
import {
  Button,
  Calendar,
  DateField,
  DatePicker,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  Separator,
  TextField,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseDate } from "@internationalized/date";
import { format, isFuture, parseISO } from "date-fns";
import { keyFromSelector } from "i18next";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { messageSelectors, translateMessage } from "@/i18n/messages";
import { capitalizeFirst } from "@/lib/utils";

import { dogPhotoSchema } from "../schemas/dogPhotoSchema";
import { DogPhotoPicker } from "./DogPhotoPicker";

// Mirrors NAME_MAX_LENGTH in the backend dog-input.dto.ts.
const NAME_MAX_LENGTH = 100;
const tooLong = keyFromSelector(messageSelectors.textTooLong);

const schema = z.object({
  name: z
    .string()
    .trim()
    .overwrite(capitalizeFirst)
    .min(1, keyFromSelector(messageSelectors.dogNameRequired))
    .max(NAME_MAX_LENGTH, tooLong),
  breed: z.string().trim().max(NAME_MAX_LENGTH, tooLong),
  birthDate: z
    .union([
      z.literal(""),
      z.iso.date({
        error: keyFromSelector(messageSelectors.dogBirthDateInvalid),
      }),
    ])
    .refine(
      (date) => !date || !isFuture(parseISO(date)),
      keyFromSelector(messageSelectors.dogBirthDateFuture),
    ),
  photo: dogPhotoSchema.nullable(),
});

export type AddDogValues = z.infer<typeof schema>;

export function AddDogForm({
  onSubmit,
  onCancel,
  isPending,
  defaultValues,
  submitLabel,
  errorLabel,
  showPhoto = true,
}: {
  onSubmit: (values: AddDogValues) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
  defaultValues?: AddDogValues;
  submitLabel?: string;
  errorLabel?: string;
  showPhoto?: boolean;
}) {
  const { t } = useTranslation();
  const [maxBirthDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const form = useForm<AddDogValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {
      name: "",
      breed: "",
      birthDate: "",
      photo: null,
    },
  });
  const isSubmitting = isPending || form.formState.isSubmitting;
  const errorText = (message: string | undefined) =>
    message ? translateMessage(t, message) : undefined;

  return (
    <Form
      className="max-w-full min-w-0"
      validationBehavior="aria"
      onSubmit={form.handleSubmit(async (values) => {
        if (isSubmitting) return;
        try {
          await onSubmit(values);
        } catch {
          form.setError("root", {
            message: errorLabel ?? t(($) => $.dogs.addError),
          });
        }
      })}
    >
      <Modal.Body className="flex min-w-0 flex-col gap-5">
        {/* Desktop keeps details and photo side by side so nothing scrolls;
            the mobile sheet stacks the photo under the fields. */}
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
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
                  <Input
                    ref={ref}
                    autoComplete="off"
                    placeholder={t(($) => $.dogs.namePlaceholder)}
                  />
                  <FieldError>
                    {errorText(fieldState.error?.message)}
                  </FieldError>
                </TextField>
              )}
            />
            <Controller
              control={form.control}
              name="breed"
              render={({ field: { ref, ...field }, fieldState }) => (
                <TextField
                  {...field}
                  isDisabled={isSubmitting}
                  isInvalid={fieldState.invalid}
                  fullWidth
                >
                  <Label>{t(($) => $.dogs.breed)}</Label>
                  <Input
                    ref={ref}
                    autoComplete="off"
                    placeholder={t(($) => $.dogs.breedPlaceholder)}
                  />
                  <FieldError>
                    {errorText(fieldState.error?.message)}
                  </FieldError>
                </TextField>
              )}
            />
            <Controller
              control={form.control}
              name="birthDate"
              render={({ field, fieldState }) => (
                <DatePicker
                  name={field.name}
                  value={field.value ? parseDate(field.value) : null}
                  onChange={(value) => field.onChange(value?.toString() ?? "")}
                  onBlur={field.onBlur}
                  maxValue={parseDate(maxBirthDate)}
                  validationBehavior="aria"
                  isDisabled={isSubmitting}
                  isInvalid={fieldState.invalid}
                  className="w-full min-w-0"
                >
                  <Label>{t(($) => $.dogs.birthDate)}</Label>
                  <DateField.Group
                    fullWidth
                    className="min-w-0"
                    ref={(element) =>
                      field.ref(
                        element
                          ? {
                              focus: () =>
                                element
                                  .querySelector<HTMLElement>(
                                    '[role="spinbutton"]',
                                  )
                                  ?.focus(),
                            }
                          : null,
                      )
                    }
                  >
                    <DateField.Input>
                      {(segment) => <DateField.Segment segment={segment} />}
                    </DateField.Input>
                    <DateField.Suffix>
                      <DatePicker.Trigger>
                        <DatePicker.TriggerIndicator />
                      </DatePicker.Trigger>
                    </DateField.Suffix>
                  </DateField.Group>
                  <FieldError>
                    {errorText(fieldState.error?.message)}
                  </FieldError>
                  <DatePicker.Popover>
                    <Calendar aria-label={t(($) => $.dogs.birthDate)}>
                      <Calendar.Header>
                        <Calendar.YearPickerTrigger>
                          <Calendar.YearPickerTriggerHeading />
                          <Calendar.YearPickerTriggerIndicator />
                        </Calendar.YearPickerTrigger>
                        <Calendar.NavButton slot="previous" />
                        <Calendar.NavButton slot="next" />
                      </Calendar.Header>
                      <Calendar.Grid>
                        <Calendar.GridHeader>
                          {(day) => (
                            <Calendar.HeaderCell>{day}</Calendar.HeaderCell>
                          )}
                        </Calendar.GridHeader>
                        <Calendar.GridBody>
                          {(date) => <Calendar.Cell date={date} />}
                        </Calendar.GridBody>
                      </Calendar.Grid>
                      <Calendar.YearPickerGrid>
                        <Calendar.YearPickerGridBody>
                          {({ year }) => (
                            <Calendar.YearPickerCell year={year} />
                          )}
                        </Calendar.YearPickerGridBody>
                      </Calendar.YearPickerGrid>
                    </Calendar>
                  </DatePicker.Popover>
                </DatePicker>
              )}
            />
          </div>
          {showPhoto && (
            <Separator orientation="vertical" className="hidden md:block" />
          )}
          {showPhoto && (
            <div className="min-w-0 md:w-70 md:shrink-0">
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
                    errorMessage={errorText(fieldState.error?.message)}
                  />
                )}
              />
            </div>
          )}
        </div>
        {form.formState.errors.root ? (
          <p role="alert" className="text-sm text-danger">
            {errorLabel ?? t(($) => $.dogs.addError)}
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
          {submitLabel ?? t(($) => $.navigation.addDog)}
        </Button>
      </Modal.Footer>
    </Form>
  );
}
