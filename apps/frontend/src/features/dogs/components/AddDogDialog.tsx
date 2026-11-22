import { useId } from "react";
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
  useDogLimit,
  usePlusOffer,
} from "@/features/subscription/hooks/useSubscription";

import { AddDogForm } from "./AddDogForm";

/** Sidebar trigger; the dialog itself is rendered once by the layout. */
export function AddDogButton() {
  const { t } = useTranslation();
  const { user } = useSession();
  const setIsOpen = useSetAtom(addDogDialogOpenAtom);
  const offer = usePlusOffer();
  const { limit, needsPlus, plusFull } = useDogLimit();
  const noteId = useId();

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="secondary"
        isDisabled={!user || plusFull}
        className="h-9 w-full gap-2 rounded-3xl"
        data-tour="add-dog"
        aria-describedby={plusFull ? noteId : undefined}
        // The limit is checked when the dialog opens, not while it is open:
        // adding the first dog must not turn into a Plus offer.
        onPress={() =>
          needsPlus
            ? offer({ reason: "dogs", onSuccess: () => setIsOpen(true) })
            : setIsOpen(true)
        }
      >
        <Plus className="size-4" aria-hidden="true" />
        {t(($) => $.navigation.addDog)}
      </Button>
      {plusFull && (
        <p id={noteId} className="text-xs text-muted">
          {t(($) => $.limits.plusDogLimit, { limit })}
        </p>
      )}
    </div>
  );
}

export function AddDogDialog() {
  const { t } = useTranslation();
  const { user } = useSession();
  const addDog = useAddDog(user?.id);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useAtom(addDogDialogOpenAtom);
  const tour = useTour();

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
      <Modal.Container size="lg" scroll="outside">
        <Modal.Dialog className="min-w-0 md:max-w-200">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{t(($) => $.navigation.addDog)}</Modal.Heading>
          </Modal.Header>
          {isOpen && (
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
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
