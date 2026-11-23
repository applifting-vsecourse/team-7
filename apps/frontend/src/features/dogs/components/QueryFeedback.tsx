import { Button } from "@heroui/react";
import { HTTPError } from "ky";
import { useTranslation } from "react-i18next";

import { LockedFeature } from "@/features/subscription/components/LockedFeature";
import { subscriptionError } from "@/features/subscription/hooks/subscriptionError";

import { ArchivedDogLocked } from "./ArchivedDogLocked";

export function QueryFeedback({
  query,
  dogId,
  errorMessage,
}: {
  /** The dog the query is about, so an archived dog can offer "Restore". */
  dogId?: string;
  /** Replaces the default "could not load the profile" message. */
  errorMessage?: string;
  query: {
    isPending: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => unknown;
  };
}) {
  const { t } = useTranslation();
  if (query.isPending) {
    return (
      <p role="status" className="text-sm text-muted">
        {t(($) => $.dogs.pageLoading)}
      </p>
    );
  }
  if (!query.isError) return null;
  if (dogId && subscriptionError(query.error) === "dogArchived") {
    return <ArchivedDogLocked dogId={dogId} />;
  }
  if (
    ["dogLocked", "dogChoiceRequired"].includes(
      subscriptionError(query.error) ?? "",
    )
  ) {
    return (
      <div className="flex min-h-96 flex-1 items-center justify-center">
        <div className="w-full max-w-md">
          <LockedFeature
            centered
            reason="renew"
            title={t(($) => $.limits.dogLockedTitle)}
            description={t(($) => $.limits.dogLockedDescription)}
          />
        </div>
      </div>
    );
  }
  const missing =
    query.error instanceof HTTPError && query.error.response.status === 404;
  return (
    <div className="flex animate-enter flex-col items-start gap-3">
      <p role="alert" className="text-sm text-danger">
        {errorMessage ??
          (missing
            ? t(($) => $.dogs.notFound)
            : t(($) => $.dogProfile.loadError))}
      </p>
      <Button
        variant="secondary"
        onPress={() => {
          void query.refetch();
        }}
      >
        {t(($) => $.dogs.retry)}
      </Button>
    </div>
  );
}
