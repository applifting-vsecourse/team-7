import { Button } from "@heroui/react"

import { ErrorLayout } from "./ErrorLayout"

type RootErrorBoundaryProps = {
  error: Error
}

export function RootErrorBoundary({ error }: RootErrorBoundaryProps) {
  return (
    <ErrorLayout
      title="Something went wrong"
      description={error.message || "An unexpected error occurred."}
      action={<Button onPress={() => window.location.reload()}>Reload</Button>}
    />
  )
}
