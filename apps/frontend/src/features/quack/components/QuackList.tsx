import { Alert, Button } from "@heroui/react"
import { Loader2, RefreshCw } from "lucide-react"

import type { Quack } from "@/features/quack/api/quackSchemas"
import { QuackItem } from "@/features/quack/components/QuackItem"

type QuackListProps = {
  quacks: Quack[]
  isLoading?: boolean
  error?: Error
  onReload?: () => void
}

export function QuackList({ quacks, isLoading, error, onReload }: QuackListProps) {
  return (
    <div className="flex flex-col">
      {isLoading && quacks.length === 0 ? (
        <div
          role="status"
          aria-label="Loading quacks"
          className="flex items-center justify-center py-8 text-muted"
        >
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : null}

      {error ? (
        <Alert
          status="danger"
          role="alert"
          className="mb-4"
        >
          <Alert.Content>
            <Alert.Title>Couldn&apos;t load quacks</Alert.Title>
            <Alert.Description>{error.message}</Alert.Description>
          </Alert.Content>
          {onReload ? (
            <Button
              variant="outline"
              size="sm"
              onPress={onReload}
            >
              <RefreshCw className="size-4" />
              Reload
            </Button>
          ) : null}
        </Alert>
      ) : null}

      {!isLoading && !error && quacks.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">No quacks yet. Post the first one.</p>
      ) : null}

      {quacks.map((quack) => (
        <QuackItem
          key={quack.id}
          quack={quack}
        />
      ))}
    </div>
  )
}
