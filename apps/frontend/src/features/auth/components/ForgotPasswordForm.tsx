import { useState } from "react";
import {
  Alert,
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/features/auth/lib/auth-client";

const schema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Invalid email"),
});

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });
  const isPending = form.formState.isSubmitting;

  return (
    <Form
      validationBehavior="aria"
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(async ({ email }) => {
        if (isPending) return;
        setErrorMessage(null);
        setSent(false);
        try {
          const { error } = await authClient.requestPasswordReset({ email });
          if (error) {
            throw new Error(error.message ?? "Unable to send reset link");
          }
          setSent(true);
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to send reset link",
          );
        }
      })}
    >
      {sent ? (
        <Alert status="success" role="status">
          <Alert.Content>
            <Alert.Description>
              If an account exists for this email, you’ll receive a password
              reset link.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      {errorMessage ? (
        <Alert status="danger" role="alert">
          <Alert.Content>
            <Alert.Description>{errorMessage}</Alert.Description>
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
            isRequired
            fullWidth
            isInvalid={fieldState.invalid}
            isDisabled={isPending}
          >
            <Label>Email</Label>
            <Input
              ref={ref}
              autoComplete="email"
              placeholder="jane@example.com"
              className="shadow-none"
            />
            <FieldError>{fieldState.error?.message}</FieldError>
          </TextField>
        )}
      />
      <Button
        type="submit"
        fullWidth
        isPending={isPending}
        isDisabled={isPending}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Send reset link
      </Button>
    </Form>
  );
}
