import { useRef } from "react";
import {
  Alert,
  Button,
  Checkbox,
  FieldError,
  Form,
  Input,
  Label,
  Link,
  TextField,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { keyFromSelector } from "i18next";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { ROUTES } from "@/app/routes";
import { messageSelectors, translateMessage } from "@/i18n/messages";

import { PasswordInput } from "./PasswordInput";

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, keyFromSelector(messageSelectors.emailRequired))
    .email(keyFromSelector(messageSelectors.emailInvalid)),
  password: z
    .string()
    .trim()
    .min(1, keyFromSelector(messageSelectors.passwordRequired)),
  rememberMe: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

type SignInFormProps = {
  isLoading: boolean;
  errorMessage?: string | null;
  onSubmit: (values: FormValues) => void | Promise<void>;
};

export function SignInForm({
  isLoading,
  errorMessage,
  onSubmit,
}: SignInFormProps) {
  const { t } = useTranslation();
  const submitting = useRef(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", rememberMe: false },
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
      <Controller
        control={form.control}
        name="email"
        render={({ field: { ref, ...field }, fieldState }) => (
          <TextField
            {...field}
            type="email"

            isInvalid={fieldState.invalid}
            isDisabled={isPending}
            fullWidth
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
      <Controller
        control={form.control}
        name="password"
        render={({ field: { ref, ...field }, fieldState }) => (
          <TextField
            {...field}
            isInvalid={fieldState.invalid}
            isDisabled={isPending}
            fullWidth
          >
            <Label>{t(($) => $.auth.fields.password)}</Label>
            <PasswordInput ref={ref} autoComplete="current-password" />
            <FieldError>
              {fieldState.error?.message
                ? translateMessage(t, fieldState.error.message)
                : undefined}
            </FieldError>
          </TextField>
        )}
      />
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <Controller
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <Checkbox
              name={field.name}
              isSelected={field.value}
              onChange={field.onChange}
              isDisabled={isPending}
            >
              <Checkbox.Content className="gap-3 text-sm font-medium">
                <Checkbox.Control className="size-4">
                  <Checkbox.Indicator />
                </Checkbox.Control>
                {t(($) => $.auth.rememberMe)}
              </Checkbox.Content>
            </Checkbox>
          )}
        />
        <Link
          href={ROUTES.forgotPassword}
          className="text-sm font-medium text-foreground"
        >
          {t(($) => $.auth.forgotPassword)}
        </Link>
      </div>
      <Button
        type="submit"
        size="lg"
        fullWidth
        isPending={isPending}
        isDisabled={isPending}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        {t(($) => $.auth.signIn)}
      </Button>
    </Form>
  );
}
