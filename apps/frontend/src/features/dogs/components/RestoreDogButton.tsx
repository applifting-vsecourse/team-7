import type { Dog } from "../api/dogsQueryOptions";
import { Button, type ButtonProps, toast } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  useSubscription,
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
  const subscription = useSubscription();
  const offer = usePlusOffer();
  const restoreDog = useRestoreDog();
  const restore = useMutation({
    mutationFn: () => restoreDog(dog),
    onError: () => toast.danger(t(($) => $.dogArchive.restoreError)),
  });
  return (
    <Button
      variant={variant}
      className={className}
      isPending={restore.isPending}
      onPress={() => {
        if (
          subscription.data &&
          !subscription.data.isPlus &&
          subscription.data.dogs >= subscription.data.freeDogLimit
        ) {
          offer({ reason: "dogs", onSuccess: () => restore.mutate() });
        } else restore.mutate();
      }}
    >
      {t(($) => $.dogArchive.restore)}
    </Button>
  );
}
