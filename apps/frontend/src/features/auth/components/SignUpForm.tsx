import { useRef } from "react"
import { Alert, Button, FieldError, Form, Input, Label, TextField } from "@heroui/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

const schema = z
  .object({
    email: z.string().trim().min(1, "Email is required").email("Invalid email"),
    name: z.string().trim().min(1, "Name is required"),
    username: z.string().trim().min(1, "Username is required"),
    password: z.string().trim().min(8, "Password must be at least 8 characters"),
    passwordConfirmation: z.string().trim().min(1, "Password confirmation is required"),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: "Passwords must match",
    path: ["passwordConfirmation"],
  })

type FormValues = z.infer<typeof schema>

const fields = [
  { name: "name", label: "Name", autoComplete: "name", type: "text" },
  { name: "username", label: "Username", autoComplete: "username", type: "text" },
  { name: "email", label: "Email", autoComplete: "email", type: "email" },
  { name: "password", label: "Password", autoComplete: "new-password", type: "password" },
  {
    name: "passwordConfirmation",
    label: "Confirm password",
    autoComplete: "new-password",
    type: "password",
  },
] as const

type SignUpFormProps = {
  isLoading: boolean
  errorMessage?: string | null
  onSubmit: (values: FormValues) => void | Promise<void>
}

export function SignUpForm({ isLoading, errorMessage, onSubmit }: SignUpFormProps) {
  const submitting = useRef(false)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", name: "", username: "", password: "", passwordConfirmation: "" },
  })
  const isPending = isLoading || form.formState.isSubmitting

  return (
    <Form
      validationBehavior="aria"
      onSubmit={(event) =>
        form.handleSubmit(async (values) => {
          if (submitting.current || isLoading) return
          submitting.current = true
          try {
            await onSubmit(values)
          } finally {
            submitting.current = false
          }
        })(event)
      }
      className="space-y-4"
    >
      {errorMessage ? (
        <Alert
          status="danger"
          role="alert"
        >
          <Alert.Content>
            <Alert.Description>{errorMessage}</Alert.Description>
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
              isRequired
              isInvalid={fieldState.invalid}
              isDisabled={isPending}
              fullWidth
            >
              <Label>{label}</Label>
              <Input
                ref={ref}
                autoComplete={autoComplete}
                placeholder={name === "email" ? "e.g. john@doe.com" : undefined}
                className="shadow-none"
              />
              <FieldError>{fieldState.error?.message}</FieldError>
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
        Sign up
      </Button>
    </Form>
  )
}
