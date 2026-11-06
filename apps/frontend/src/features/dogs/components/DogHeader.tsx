import { useState } from "react";
import type { DogProfile } from "../api/dogProfileQueryOptions";
import { Archive, EllipsisVertical, Pencil, TrashBin } from "@gravity-ui/icons";
import {
  Button,
  Description,
  Dropdown,
  Label,
  Modal,
  toast,
} from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api-client";

import { DeleteDialog } from "@/features/disciplines/components/DeleteDialog";

import { useDogMeta } from "../hooks/useDogMeta";
import {
  useDogAction,
  useDogProfileMutation,
} from "../hooks/useDogProfileMutation";
import { useRestoreDog } from "../hooks/useRestoreDog";
import { AddDogForm, type AddDogValues } from "./AddDogForm";
import { DogAvatar } from "./DogAvatar";
import { EditDogPhotoDialog } from "./EditDogPhotoDialog";

export function DogHeader({ dog }: { dog: DogProfile }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<"archive" | "delete" | null>(null);
  const action = useDogAction(dog.id);
  const restoreDog = useRestoreDog();
  const archived = Boolean(dog.archivedAt);
  const save = useDogProfileMutation(
    ({ name, breed, birthDate }: AddDogValues) =>
      api.patch(`dogs/${encodeURIComponent(dog.id)}`, {
        json: { name, breed, birthDate: birthDate || null },
      }),
  );
  const showArchivedToast = () => {
    let undoPending = false;
    const toastId = toast.success(
      t(($) => $.dogArchive.archivedToast, { name: dog.name }),
      {
        timeout: 10000,
        actionProps: {
          children: t(($) => $.training.undo),
          // Matches the other undo toasts (DogExerciseView).
          variant: "ghost",
          onPress: () => {
            if (undoPending) return;
            undoPending = true;
            void restoreDog(dog)
              .then(() => toast.close(toastId))
              .catch(() => toast.danger(t(($) => $.dogArchive.restoreError)))
              .finally(() => {
                undoPending = false;
              });
          },
        },
      },
    );
  };
  const meta = useDogMeta(dog);
  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          {/* An archived dog is read-only, its photo included. */}
          {archived ? (
            <DogAvatar dog={dog} className="size-14 md:size-16" />
          ) : (
            <EditDogPhotoDialog
              dog={dog}
              avatarClassName="size-14 md:size-16"
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h1
              id="dog-heading"
              className="text-3xl leading-9 font-semibold tracking-tight wrap-break-word"
            >
              {dog.name}
            </h1>
            {meta && <p className="text-sm leading-6 text-muted">{meta}</p>}
          </div>
        </div>
        {/* An archived dog is read-only until it is restored. */}
        {!archived && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="flex-1 md:flex-none"
              onPress={() => setEditing(true)}
            >
              <Pencil className="size-4" aria-hidden="true" />
              {t(($) => $.disciplines.edit)}
            </Button>
            <Dropdown>
              <Button
                variant="ghost"
                isIconOnly
                aria-label={t(($) => $.dogProfile.dogActions)}
              >
                <EllipsisVertical className="size-4" aria-hidden="true" />
              </Button>
              <Dropdown.Popover placement="bottom end" className="min-w-60">
                <Dropdown.Menu
                  onAction={(key) => {
                    action.reset();
                    setConfirm(key as "archive" | "delete");
                  }}
                >
                  <Dropdown.Item
                    id="archive"
                    textValue={t(($) => $.dogProfile.archive)}
                    className="items-start"
                  >
                    {/* h-5 = the label's line height, so the icon centres on it. */}
                    <span className="flex h-5 shrink-0 items-center">
                      <Archive
                        className="size-4 text-muted"
                        aria-hidden="true"
                      />
                    </span>
                    <div className="flex flex-col">
                      <Label>{t(($) => $.dogProfile.archive)}</Label>
                      <Description>
                        {t(($) => $.dogProfile.archiveHint)}
                      </Description>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item
                    id="delete"
                    variant="danger"
                    textValue={t(($) => $.disciplines.delete)}
                    className="items-start"
                  >
                    <span className="flex h-5 shrink-0 items-center">
                      <TrashBin
                        className="size-4 text-danger"
                        aria-hidden="true"
                      />
                    </span>
                    <div className="flex flex-col">
                      <Label>{t(($) => $.disciplines.delete)}</Label>
                      <Description>
                        {t(($) => $.dogProfile.deleteHint)}
                      </Description>
                    </div>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        )}
      </div>
      <Modal.Backdrop
        isOpen={editing}
        onOpenChange={(open) => {
          if (!save.isPending) setEditing(open);
        }}
        isDismissable={!save.isPending}
        isKeyboardDismissDisabled={save.isPending}
      >
        <Modal.Container scroll="outside">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{t(($) => $.dogProfile.editDog)}</Modal.Heading>
            </Modal.Header>
            {editing && (
              <AddDogForm
                showPhoto={false}
                defaultValues={{
                  name: dog.name,
                  breed: dog.breed ?? "",
                  birthDate: dog.birthDate?.slice(0, 10) ?? "",
                  photo: null,
                }}
                isPending={save.isPending}
                submitLabel={t(($) => $.disciplines.save)}
                errorLabel={t(($) => $.disciplines.saveError)}
                onCancel={() => setEditing(false)}
                onSubmit={async (values) => {
                  await save.mutateAsync(values);
                  setEditing(false);
                }}
              />
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      {confirm && (
        <DeleteDialog
          isOpen
          onOpenChange={(open) => {
            if (!open) setConfirm(null);
          }}
          title={
            confirm === "archive"
              ? t(($) => $.dogProfile.archiveTitle, { name: dog.name })
              : t(($) => $.dogProfile.deleteTitle, { name: dog.name })
          }
          body={
            confirm === "archive"
              ? t(($) => $.dogProfile.archiveHint)
              : t(($) => $.dogProfile.deleteHint)
          }
          affectedDogCount={0}
          isPending={action.isPending}
          isError={action.isError}
          confirmLabel={
            confirm === "archive" ? t(($) => $.dogProfile.archive) : undefined
          }
          isDestructive={confirm === "delete"}
          onConfirm={async () => {
            try {
              await action.mutateAsync(confirm);
              if (confirm === "archive") showArchivedToast();
              await navigate({ to: "/overview" });
            } catch {
              /* Show error in the dialog. */
            }
          }}
        />
      )}
    </>
  );
}
