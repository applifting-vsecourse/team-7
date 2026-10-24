import { useState } from "react";
import { Button, Form, Modal } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api-client";

import { useSession } from "@/features/auth/hooks/useSession";
import {
  dogsQueryOptions,
  type Dog,
} from "@/features/dogs/api/dogsQueryOptions";

import { photoFormData, type DogPhoto } from "../api/dogPhotos";
import { dogProfileKey } from "../api/dogProfileQueryOptions";
import { DogAvatar } from "./DogAvatar";
import { DogPhotoPicker } from "./DogPhotoPicker";

export function EditDogPhotoDialog({
  dog,
  avatarClassName = "size-9 md:size-8",
}: {
  dog: Dog;
  // Size of the avatar that opens the dialog.
  avatarClassName?: string;
}) {
  const { t } = useTranslation();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [photo, setPhoto] = useState<DogPhoto | null>(null);
  const [photoError, setPhotoError] = useState(false);
  const mutation = useMutation({
    mutationFn: async (action: "save" | "remove") =>
      action === "remove"
        ? api.delete(`dogs/${dog.id}/avatar`).json<Dog>()
        : api
            .put(`dogs/${dog.id}/avatar`, { body: await photoFormData(photo!) })
            .json<Dog>(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: dogsQueryOptions(user?.id).queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: dogProfileKey(user?.id),
      });
      setIsOpen(false);
      setPhoto(null);
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (mutation.isPending) return;
        setIsOpen(open);
        setPhoto(null);
        setPhotoError(false);
        mutation.reset();
      }}
    >
      <Button
        variant="ghost"
        isIconOnly
        aria-label={t(($) => $.dogs.editPhotoFor, { name: dog.name })}
        className={`shrink-0 rounded-full p-0 ${avatarClassName}`}
      >
        <DogAvatar dog={dog} className={avatarClassName} />
      </Button>
      <Modal.Backdrop
        isDismissable={!mutation.isPending}
        isKeyboardDismissDisabled={mutation.isPending}
      >
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>
                {t(($) => $.dogs.editPhotoFor, { name: dog.name })}
              </Modal.Heading>
            </Modal.Header>
            <Form
              onSubmit={(event) => {
                event.preventDefault();
                if (photo && !photoError && !mutation.isPending) {
                  mutation.mutate("save");
                }
              }}
            >
              <Modal.Body className="flex flex-col gap-5">
                {!photo ? (
                  <div className="self-center">
                    <DogAvatar dog={dog} className="size-32" />
                  </div>
                ) : null}
                <DogPhotoPicker
                  value={photo}
                  onChange={setPhoto}
                  onErrorChange={setPhotoError}
                  isDisabled={mutation.isPending}
                />
                {mutation.isError ? (
                  <p role="alert" className="text-sm text-danger">
                    {t(($) => $.dogs.photoSaveError)}
                  </p>
                ) : null}
                {dog.avatarVersion ? (
                  <Button
                    variant="danger-soft"
                    isDisabled={mutation.isPending}
                    onPress={() => mutation.mutate("remove")}
                  >
                    {t(($) => $.dogs.removePhoto)}
                  </Button>
                ) : null}
              </Modal.Body>
              <Modal.Footer className="flex-col-reverse sm:flex-row">
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  isDisabled={mutation.isPending}
                  onPress={() => {
                    setIsOpen(false);
                    setPhoto(null);
                  }}
                >
                  {t(($) => $.dogs.cancel)}
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  isPending={mutation.isPending}
                  isDisabled={!photo || photoError || mutation.isPending}
                >
                  {t(($) => $.dogs.savePhoto)}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
