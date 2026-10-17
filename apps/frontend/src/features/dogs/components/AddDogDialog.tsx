import { useState } from "react";
import { Plus } from "@gravity-ui/icons";
import { Button, Form, Input, Label, Modal, TextField } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { useSession } from "@/features/auth/hooks/useSession";
import { useAddDog } from "@/features/dogs/hooks/useAddDog";

export function AddDogDialog() {
  const { t } = useTranslation();
  const { user } = useSession();
  const addDog = useAddDog(user?.id);
  const [name, setName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (addDog.isPending) return;
        setIsOpen(open);
        setName("");
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
            <Form
              onSubmit={(event) => {
                event.preventDefault();
                if (!name.trim() || addDog.isPending || !user) return;
                addDog.mutate(name, {
                  onSuccess: () => {
                    setIsOpen(false);
                    setName("");
                  },
                });
              }}
            >
              <Modal.Body>
                <TextField
                  name="name"
                  value={name}
                  onChange={setName}
                  isRequired
                  isDisabled={addDog.isPending}
                  fullWidth
                >
                  <Label>{t(($) => $.dogs.name)}</Label>
                  {/* The dialog opens on request, so focus the field for immediate typing. */}
                  {/* oxlint-disable-next-line jsx-a11y/no-autofocus */}
                  <Input autoFocus autoComplete="off" />
                </TextField>
                {addDog.isError ? (
                  <p role="alert" className="text-sm text-danger">
                    {t(($) => $.dogs.addError)}
                  </p>
                ) : null}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  isDisabled={addDog.isPending}
                  onPress={() => setIsOpen(false)}
                >
                  {t(($) => $.dogs.cancel)}
                </Button>
                <Button
                  type="submit"
                  isPending={addDog.isPending}
                  isDisabled={!name.trim() || addDog.isPending}
                >
                  {t(($) => $.navigation.addDog)}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
