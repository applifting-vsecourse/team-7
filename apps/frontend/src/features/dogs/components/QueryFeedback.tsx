import { Button } from "@heroui/react";
import { HTTPError } from "ky";
import { useTranslation } from "react-i18next";

export function QueryFeedback({
  query,
}: {
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
  const missing =
    query.error instanceof HTTPError && query.error.response.status === 404;
  return (
    <div className="flex flex-col items-start gap-3">
      <p role="alert" className="text-sm text-danger">
        {missing ? t(($) => $.dogs.notFound) : t(($) => $.dogProfile.loadError)}
      </p>
      <Button
        variant="secondary"
        size="sm"
        onPress={() => {
          void query.refetch();
        }}
      >
        {t(($) => $.dogs.retry)}
      </Button>
    </div>
  );
}
