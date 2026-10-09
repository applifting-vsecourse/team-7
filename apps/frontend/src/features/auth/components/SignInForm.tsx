import { useRef } from "react"
import { Alert, Button, FieldError, Form, Input, Label, TextField } from "@heroui/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

const schema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Invalid email"),
  password: z.string().trim().min(1, "Password is required"),
})

type FormValues = z.infer<typeof schema>

type SignInFormProps = {
  isLoading: boolean
  errorMessage?: string | null
  onSubmit: (values: FormValues) => void | Promise<void>
}

export function SignInForm({ isLoading, errorMessage, onSubmit }: SignInFormProps) {
  const submitting = useRef(false)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
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
      <Controller
        control={form.control}
        name="email"
        render={({ field: { ref, ...field }, fieldState }) => (
          <TextField
            {...field}
            type="email"
            isRequired
            isInvalid={fieldState.invalid}
            isDisabled={isPending}
            fullWidth
          >
            <Label>Email</Label>
            <Input
              ref={ref}
              autoComplete="email"
              placeholder="e.g. john@doe.com"
              className="shadow-none"
            />
            <FieldError>{fieldState.error?.message}</FieldError>
          </TextField>
        )}
      />
      <Controller
        control={form.control}
        name="password"
        render={({ field: { ref, ...field }, fieldState }) => (
          <TextField
            {...field}
            type="password"
            isRequired
            isInvalid={fieldState.invalid}
            isDisabled={isPending}
            fullWidth
          >
            <Label>Password</Label>
            <Input
              ref={ref}
              autoComplete="current-password"
              className="shadow-none"
            />
            <FieldError>{fieldState.error?.message}</FieldError>
          </TextField>
        )}
      />
      <Button
        type="submit"
        size="lg"
        fullWidth
        isPending={isPending}
        isDisabled={isPending}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Sign in
      </Button>
    </Form>
  )
}
