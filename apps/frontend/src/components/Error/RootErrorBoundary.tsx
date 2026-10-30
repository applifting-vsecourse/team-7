import { Button } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { translateMessage } from "@/i18n/messages";

import { ErrorLayout } from "./ErrorLayout";

type RootErrorBoundaryProps = {
  error: unknown;
};

export function RootErrorBoundary({ error }: RootErrorBoundaryProps) {
  const { t } = useTranslation();
  return (
    <ErrorLayout
      title={t(($) => $.errors.unexpected.title)}
      description={
        error instanceof Error && error.message
          ? translateMessage(t, error.message)
          : t(($) => $.errors.unexpected.description)
      }
      action={
        <Button onPress={() => window.location.reload()}>
          {t(($) => $.errors.reload)}
        </Button>
      }
    />
  );
}
