import { useState } from "react";
import { Button, Label, Modal, Radio, RadioGroup } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useSession } from "@/features/auth/hooks/useSession";
import { dogProfileQueryOptions } from "@/features/dogs/api/dogProfileQueryOptions";
import type { Dog } from "@/features/dogs/api/dogsQueryOptions";
import { AssignDisciplineDialog } from "@/features/dogs/components/AssignDisciplineDialog";
import { DogAvatar } from "@/features/dogs/components/DogAvatar";
import { QueryFeedback } from "@/features/dogs/components/QueryFeedback";

/** "Add to a dog", step 0: which dog, when more than one can take it. */
export function DogPickDialog({
  name,
  dogs,
  isPending,
  onPick,
  onClose,
}: {
  name: string;
  dogs: Dog[];
  isPending: boolean;
  onPick: (dogId: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [dogId, setDogId] = useState(dogs[0]?.id ?? "");

  return (
    <Modal.Backdrop
      isOpen
      onOpenChange={(open) => {
        if (!open && !isPending) onClose();
      }}
      isDismissable={!isPending}
    >
      <Modal.Container scroll="outside">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{t(($) => $.disciplines.addToDog)}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-5">
            <RadioGroup value={dogId} onChange={setDogId}>
              <Label>{t(($) => $.disciplines.whichDog, { name })}</Label>
              {dogs.map((dog) => (
                <Radio key={dog.id} value={dog.id}>
                  <Radio.Control>
                    <Radio.Indicator />
                  </Radio.Control>
                  <Radio.Content className="flex items-center gap-3">
                    <DogAvatar dog={dog} className="size-8" />
                    <span className="text-base leading-6 font-medium">
                      {dog.name}
                    </span>
                  </Radio.Content>
                </Radio>
              ))}
            </RadioGroup>
            <p className="text-sm leading-6 text-muted">
              {t(($) => $.disciplines.goalsNext)}
            </p>
          </Modal.Body>
          <Modal.Footer className="flex-wrap">
            <Button
              variant="secondary"
              isDisabled={isPending}
              className="flex-auto sm:flex-none"
              onPress={onClose}
            >
              {t(($) => $.dogs.cancel)}
            </Button>
            <Button
              isDisabled={!dogId || isPending}
              isPending={isPending}
              className="flex-auto sm:flex-none"
              onPress={() => onPick(dogId)}
            >
              {t(($) => $.dogProfile.continue)}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

/** "Add to a dog", the rest: the dog's assign dialog on choosing goals. */
export function AssignToDog({
  dogId,
  disciplineId,
  onClose,
}: {
  dogId: string;
  disciplineId: string;
  onClose: () => void;
}) {
  const { user } = useSession();
  const profile = useQuery(dogProfileQueryOptions(user?.id, dogId));
  if (!profile.data) {
    return profile.isError ? (
      <Modal.Backdrop isOpen onOpenChange={(open) => !open && onClose()}>
        <Modal.Container scroll="outside">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Body>
              <QueryFeedback query={profile} dogId={dogId} />
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    ) : null;
  }
  return (
    <AssignDisciplineDialog
      dog={profile.data}
      disciplineId={disciplineId}
      onClose={onClose}
    />
  );
}
