import { useRef } from "react"
import { Alert, Button, FieldError, Form, Label, TextArea, TextField } from "@heroui/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { cn } from "@/lib/utils"

import { useAddQuack } from "@/features/quack/hooks/useAddQuack"

// Mirrors the server-side DTO (MaxLength(280)).
const MAX_LENGTH = 280
const schema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Write something first")
    .max(MAX_LENGTH, `Keep it under ${MAX_LENGTH} characters`),
})
type FormValues = z.infer<typeof schema>
type QuackFormProps = { className?: string }

export function QuackForm({ className }: QuackFormProps) {
  const addQuack = useAddQuack()
  const submitting = useRef(false)
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { text: "" } })
  const text = useWatch({ control: form.control, name: "text" })
  const length = text?.length ?? 0
  const isPending = addQuack.isPending || form.formState.isSubmitting

  return (
    <Form
      validationBehavior="aria"
      onSubmit={(event) =>
        form.handleSubmit(async (values) => {
          if (submitting.current || addQuack.isPending) return
          submitting.current = true
          try {
            await addQuack.mutateAsync({ text: values.text })
            form.reset()
          } catch {
            // The mutation error is displayed below; keep the draft for retry.
          } finally {
            submitting.current = false
          }
        })(event)
      }
      className={cn("space-y-3", className)}
    >
      {addQuack.error ? (
        <Alert
          status="danger"
          role="alert"
        >
          <Alert.Content>
            <Alert.Description>{addQuack.error.message}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      <Controller
        control={form.control}
        name="text"
        render={({ field: { ref, ...field }, fieldState }) => (
          <TextField
            {...field}
            isRequired
            isInvalid={fieldState.invalid}
            isDisabled={isPending}
            fullWidth
          >
            <Label>New quack</Label>
            <TextArea
              ref={ref}
              rows={3}
              placeholder="Quack something..."
              className="shadow-none"
            />
            <FieldError>{fieldState.error?.message}</FieldError>
          </TextField>
        )}
      />
      <div className="flex items-center justify-end gap-3">
        <span className={cn("text-sm", length > MAX_LENGTH ? "text-danger" : "text-muted")}>
          {length}/{MAX_LENGTH}
        </span>
        <Button
          type="submit"
          size="sm"
          isPending={isPending}
          isDisabled={isPending}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Quack
        </Button>
      </div>
    </Form>
  )
}
