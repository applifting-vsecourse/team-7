import { AlertDialog, Button } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { pluralForm } from "@/lib/plural";

type DeleteDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  // Dogs whose picks disappear with the item; 0 hides the sentence.
  affectedDogCount: number;
  isPending: boolean;
  isError: boolean;
  onConfirm: () => void;
};

export function DeleteDialog({
  isOpen,
  onOpenChange,
  title,
  body,
  affectedDogCount,
  isPending,
  isError,
  onConfirm,
}: DeleteDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (isPending) return;
        onOpenChange(open);
      }}
      isDismissable={!isPending}
      isKeyboardDismissDisabled={isPending}
    >
      <AlertDialog.Container>
        <AlertDialog.Dialog className="sm:max-w-100">
          <AlertDialog.Header>
            <AlertDialog.Icon status="danger" />
            <AlertDialog.Heading>{title}</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body className="flex flex-col gap-2">
            <p>
              {body}{" "}
              {affectedDogCount > 0
                ? t(
                    ($) =>
                      $.disciplines.deleteDialog.affectedDogs[
                        pluralForm(affectedDogCount)
                      ],
                    { count: affectedDogCount },
                  )
                : null}{" "}
              {t(($) => $.disciplines.deleteDialog.irreversible)}
            </p>
            {isError ? (
              <p role="alert" className="text-sm text-danger">
                {t(($) => $.disciplines.deleteDialog.error)}
              </p>
            ) : null}
          </AlertDialog.Body>
          <AlertDialog.Footer className="flex-col-reverse sm:flex-row">
            <Button
              variant="secondary"
              isDisabled={isPending}
              onPress={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              {t(($) => $.disciplines.cancel)}
            </Button>
            <Button
              variant="danger"
              isPending={isPending}
              isDisabled={isPending}
              onPress={onConfirm}
              className="w-full sm:w-auto"
            >
              {t(($) => $.disciplines.deleteDialog.confirm)}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
