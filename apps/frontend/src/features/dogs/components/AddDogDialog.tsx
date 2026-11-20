import { useEffect } from "react";
import { Plus } from "@gravity-ui/icons";
import { Button, Modal, toast } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { useAtom, useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";

import { useSession } from "@/features/auth/hooks/useSession";
import { addDogDialogOpenAtom } from "@/features/dogs/atoms/addDogDialogOpenAtom";
import { useAddDog } from "@/features/dogs/hooks/useAddDog";
import { useTour } from "@/features/onboarding/hooks/useTour";
import {
  useSubscription,
  usePlusOffer,
} from "@/features/subscription/hooks/useSubscription";

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
      data-tour="add-dog"
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
  const tour = useTour();
  const subscription = useSubscription();
  const offer = usePlusOffer();
  const limited =
    !!subscription.data &&
    !subscription.data.isPlus &&
    subscription.data.dogs >= subscription.data.freeDogLimit;
  useEffect(() => {
    if (isOpen && limited) {
      setIsOpen(false);
      offer({ reason: "dogs", onSuccess: () => setIsOpen(true) });
    }
  }, [isOpen, limited, offer, setIsOpen]);

  return (
    <Modal.Backdrop
      isOpen={isOpen && !limited}
      onOpenChange={(open) => {
        if (addDog.isPending) return;
        setIsOpen(open);
        addDog.reset();
      }}
      isDismissable={!addDog.isPending}
      isKeyboardDismissDisabled={addDog.isPending}
    >
      <Modal.Container size="lg" scroll="outside">
        <Modal.Dialog className="min-w-0 md:max-w-200">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{t(($) => $.navigation.addDog)}</Modal.Heading>
          </Modal.Header>
          {isOpen && subscription.data && !limited ? (
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
                tour.complete("addDog");
              }}
            />
          ) : (
            <Modal.Body>
              {subscription.isError ? (
                <div className="flex flex-col items-start gap-3">
                  <p role="alert" className="text-danger">
                    {t(($) => $.subscription.loadError)}
                  </p>
                  <Button
                    variant="secondary"
                    onPress={() => void subscription.refetch()}
                  >
                    {t(($) => $.dogs.retry)}
                  </Button>
                </div>
              ) : (
                <p role="status" className="text-sm text-muted">
                  {t(($) => $.settings.loading)}
                </p>
              )}
            </Modal.Body>
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
