import { Plus } from "@gravity-ui/icons";
import { Button, Modal, toast } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { useAtom, useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";

import { useSession } from "@/features/auth/hooks/useSession";
import { addDogDialogOpenAtom } from "@/features/dogs/atoms/addDogDialogOpenAtom";
import { useAddDog } from "@/features/dogs/hooks/useAddDog";

import { AddDogForm } from "./AddDogForm";

/** Sidebar trigger; the dialog itself is rendered once by the layout. */
export function AddDogButton() {
  const { t } = useTranslation();
  const { user } = useSession();
  const setIsOpen = useSetAtom(addDogDialogOpenAtom);

  return (
    <Button
      variant="secondary"
      isDisabled={!user}
      className="h-9 w-full gap-2 rounded-3xl"
      onPress={() => setIsOpen(true)}
    >
      <Plus className="size-4" aria-hidden="true" />
      {t(($) => $.navigation.addDog)}
    </Button>
  );
}

export function AddDogDialog() {
  const { t } = useTranslation();
  const { user } = useSession();
  const addDog = useAddDog(user?.id);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useAtom(addDogDialogOpenAtom);

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (addDog.isPending) return;
        setIsOpen(open);
        addDog.reset();
      }}
      isDismissable={!addDog.isPending}
      isKeyboardDismissDisabled={addDog.isPending}
    >
      <Modal.Container size="lg">
        <Modal.Dialog className="md:max-w-200">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{t(($) => $.navigation.addDog)}</Modal.Heading>
          </Modal.Header>
          {isOpen ? (
            <AddDogForm
              isPending={addDog.isPending}
              onCancel={() => setIsOpen(false)}
              onSubmit={async (values) => {
                const dog = await addDog.mutateAsync(values);
                setIsOpen(false);
                // The new dog opens straight away and is active in the sidebar.
                toast.success(t(($) => $.dogs.addedToast, { name: dog.name }));
                void navigate({
                  to: ROUTES.dog,
                  params: { dogId: dog.id },
                });
              }}
            />
          ) : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
