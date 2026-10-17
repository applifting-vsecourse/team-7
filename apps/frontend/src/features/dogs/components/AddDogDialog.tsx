import { useState } from "react";
import { Plus } from "@gravity-ui/icons";
import { Button, Modal } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { useSession } from "@/features/auth/hooks/useSession";
import { useAddDog } from "@/features/dogs/hooks/useAddDog";

import { AddDogForm } from "./AddDogForm";

export function AddDogDialog() {
  const { t } = useTranslation();
  const { user } = useSession();
  const addDog = useAddDog(user?.id);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (addDog.isPending) return;
        setIsOpen(open);
        addDog.reset();
      }}
    >
      <Button
        variant="secondary"
        isDisabled={!user}
        className="h-9 w-full gap-2 rounded-3xl"
      >
        <Plus className="size-4" aria-hidden="true" />
        {t(($) => $.navigation.addDog)}
      </Button>
      <Modal.Backdrop
        isDismissable={!addDog.isPending}
        isKeyboardDismissDisabled={addDog.isPending}
      >
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{t(($) => $.navigation.addDog)}</Modal.Heading>
            </Modal.Header>
            {isOpen ? (
              <AddDogForm
                isPending={addDog.isPending}
                onCancel={() => setIsOpen(false)}
                onSubmit={async (values) => {
                  await addDog.mutateAsync(values);
                  setIsOpen(false);
                }}
              />
            ) : null}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
