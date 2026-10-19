import { useRef } from "react";
import {
  Alert,
  Button,
  Description,
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

import {
  messageSelectors,
  translateMessage,
  type TranslationSelector,
} from "@/i18n/messages";

import { PasswordInput } from "./PasswordInput";

const schema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, keyFromSelector(messageSelectors.emailRequired))
      .email(keyFromSelector(messageSelectors.emailInvalid)),
    name: z
      .string()
      .trim()
      .min(1, keyFromSelector(messageSelectors.nameRequired)),
    username: z
      .string()
      .trim()
      .min(1, keyFromSelector(messageSelectors.usernameRequired)),
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

type FormValues = z.infer<typeof schema>;

const fields = [
  {
    name: "name",
    label: (($) => $.auth.fields.name) satisfies TranslationSelector,
    autoComplete: "name",
    type: "text",
  },
  {
    name: "username",
    label: (($) => $.auth.fields.username) satisfies TranslationSelector,
    autoComplete: "username",
    type: "text",
  },
  {
    name: "email",
    label: (($) => $.auth.fields.email) satisfies TranslationSelector,
    autoComplete: "email",
    type: "email",
  },
  {
    name: "password",
    label: (($) => $.auth.fields.password) satisfies TranslationSelector,
    autoComplete: "new-password",
    type: "password",
  },
  {
    name: "passwordConfirmation",
    label: (($) => $.auth.fields.confirmPassword) satisfies TranslationSelector,
    autoComplete: "new-password",
    type: "password",
  },
] as const;

const requiredFields = new Set<string>(["name", "username", "email"]);

type SignUpFormProps = {
  isLoading: boolean;
  errorMessage?: string | null;
  onSubmit: (values: FormValues) => void | Promise<void>;
};

export function SignUpForm({
  isLoading,
  errorMessage,
  onSubmit,
}: SignUpFormProps) {
  const { t } = useTranslation();
  const submitting = useRef(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      name: "",
      username: "",
      password: "",
      passwordConfirmation: "",
    },
  });
  const isPending = isLoading || form.formState.isSubmitting;

  return (
    <Form
      validationBehavior="aria"
      onSubmit={(event) =>
        form.handleSubmit(async (values) => {
          if (submitting.current || isLoading) return;
          submitting.current = true;
          try {
            await onSubmit(values);
          } finally {
            submitting.current = false;
          }
        })(event)
      }
      className="space-y-4"
    >
      {errorMessage ? (
        <Alert status="danger" role="alert">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{translateMessage(t, errorMessage)}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      {fields.map(({ name, label, autoComplete, type }) => (
        <Controller
          key={name}
          control={form.control}
          name={name}
          render={({ field: { ref, ...field }, fieldState }) => (
            <TextField
              {...field}
              type={type}
              isRequired={requiredFields.has(name)}
              isInvalid={fieldState.invalid}
              isDisabled={isPending}
              fullWidth
            >
              <Label>{t(label)}</Label>
              {type === "password" ? (
                <PasswordInput ref={ref} autoComplete={autoComplete} />
              ) : (
                <Input
                  ref={ref}
                  autoComplete={autoComplete}
                  placeholder={
                    name === "email"
                      ? t(($) => $.auth.fields.emailPlaceholder)
                      : undefined
                  }
                />
              )}
              {name === "password" ? (
                <Description>
                  {t(($) => $.auth.fields.passwordHint)}
                </Description>
              ) : null}
              <FieldError>
                {fieldState.error?.message
                  ? translateMessage(t, fieldState.error.message)
                  : undefined}
              </FieldError>
            </TextField>
          )}
        />
      ))}
      <Button
        type="submit"
        size="lg"
        fullWidth
        isPending={isPending}
        isDisabled={isPending}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        {t(($) => $.auth.createAccount)}
      </Button>
    </Form>
  );
}
