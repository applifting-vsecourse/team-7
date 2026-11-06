import type { Dog } from "../api/dogsQueryOptions";
import { Button, type ButtonProps, toast } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

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
      onPress={() => restore.mutate()}
    >
      {t(($) => $.dogArchive.restore)}
    </Button>
  );
}
