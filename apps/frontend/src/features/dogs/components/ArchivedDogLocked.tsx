import { useState } from "react";
import { Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useSession } from "@/features/auth/hooks/useSession";
import { DeleteDialog } from "@/features/disciplines/components/DeleteDialog";
import { LockedFeature } from "@/features/subscription/components/LockedFeature";

import { archivedDogsQueryOptions } from "../api/dogsQueryOptions";
import { useDogAction } from "../hooks/useDogProfileMutation";
import { RestoreDogButton } from "./RestoreDogButton";

/**
 * An archived dog on Free: no data (Figma M14 style), but it can be restored
 * for free or deleted. Restoring at the dog limit offers Plus.
 */
export function ArchivedDogLocked({ dogId }: { dogId: string }) {
  const { t } = useTranslation();
  const { user } = useSession();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const remove = useDogAction(dogId);
  // Always fresh: the dog may have been archived in another tab since the
  // list was cached.
  const archived = useQuery({
    ...archivedDogsQueryOptions(user?.id),
    refetchOnMount: "always",
  });
  const dog = archived.data?.find((item) => item.id === dogId);
  if (archived.isPending || (!dog && archived.isFetching)) {
    return (
      <p role="status" className="text-sm text-muted">
        {t(($) => $.dogs.pageLoading)}
      </p>
    );
  }
  if (!dog) {
    return (
      <div className="flex animate-enter flex-col items-start gap-3">
        <p role="alert" className="text-sm text-danger">
          {archived.isError
            ? t(($) => $.dogProfile.loadError)
            : t(($) => $.dogs.notFound)}
        </p>
        <Button variant="secondary" onPress={() => void archived.refetch()}>
          {t(($) => $.dogs.retry)}
        </Button>
      </div>
    );
  }
  return (
    <div className="flex min-h-96 flex-1 items-center justify-center">
      <div className="w-full max-w-md">
        <LockedFeature
          centered
          reason="renew"
          title={t(($) => $.limits.dogArchivedTitle, { name: dog.name })}
          description={t(($) => $.limits.dogArchivedDescription)}
          actions={
            <div className="mt-1 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <RestoreDogButton
                dog={dog}
                variant="primary"
                className="w-full sm:w-auto"
              />
              <Button
                variant="danger-soft"
                className="w-full sm:w-auto"
                onPress={() => {
                  remove.reset();
                  setConfirm(true);
                }}
              >
                {t(($) => $.limits.deleteDog)}
              </Button>
            </div>
          }
        />
      </div>
      {confirm && (
        <DeleteDialog
          isOpen
          onOpenChange={setConfirm}
          title={t(($) => $.dogProfile.deleteTitle, { name: dog.name })}
          body={t(($) => $.dogProfile.deleteHint)}
          affectedDogCount={0}
          isPending={remove.isPending}
          isError={remove.isError}
          isDestructive
          onConfirm={async () => {
            try {
              await remove.mutateAsync("delete");
              await navigate({ to: "/overview" });
            } catch {
              /* Shown in the dialog. */
            }
          }}
        />
      )}
    </div>
  );
}
