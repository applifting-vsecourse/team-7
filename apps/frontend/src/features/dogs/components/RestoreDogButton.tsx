import { useId } from "react";
import type { Dog } from "../api/dogsQueryOptions";
import { Button, type ButtonProps, toast } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  useDogLimit,
  usePlusOffer,
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
  const offer = usePlusOffer();
  const restoreDog = useRestoreDog();
  const noteId = useId();
  const restore = useMutation({
    mutationFn: () => restoreDog(dog),
    onError: () => toast.danger(t(($) => $.dogArchive.restoreError)),
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
