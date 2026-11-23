import { useId } from "react";
import type { Dog } from "../api/dogsQueryOptions";
import { Button, type ButtonProps, toast } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { subscriptionError } from "@/features/subscription/hooks/subscriptionError";
import {
  useDogLimit,
  usePlusOffer,
  useSubscription,
} from "@/features/subscription/hooks/useSubscription";

import { useRestoreDog } from "../hooks/useRestoreDog";

export function RestoreDogButton({
  dog,
  variant,
  className,
}: {
  dog: Pick<Dog, "id" | "name">;
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const { t } = useTranslation();
  const { limit, needsPlus, plusFull } = useDogLimit();
  const isPlus = useSubscription().data?.isPlus;
  const offer = usePlusOffer();
  const restoreDog = useRestoreDog();
  const noteId = useId();
  const restore = useMutation({
    mutationFn: () => restoreDog(dog),
    onError: (error) => {
      // The cached count can be stale; the server's dogLimit gets the same
      // answer as a full account does up front.
      if (subscriptionError(error) !== "dogLimit") {
        toast.danger(t(($) => $.dogArchive.restoreError));
      } else if (isPlus) {
        toast.danger(t(($) => $.limits.plusDogLimit, { limit }));
      } else offer({ reason: "dogs", onSuccess: () => restore.mutate() });
    },
  });
  const button = (
    <Button
      variant={variant}
      className={plusFull ? "w-full" : className}
      isPending={restore.isPending}
      isDisabled={plusFull}
      aria-describedby={plusFull ? noteId : undefined}
      onPress={() =>
        needsPlus
          ? offer({ reason: "dogs", onSuccess: () => restore.mutate() })
          : restore.mutate()
      }
    >
      {t(($) => $.dogArchive.restore)}
    </Button>
  );
  if (!plusFull) return button;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {button}
      <p id={noteId} className="text-xs text-muted">
        {t(($) => $.limits.plusDogLimit, { limit })}
      </p>
    </div>
  );
}
