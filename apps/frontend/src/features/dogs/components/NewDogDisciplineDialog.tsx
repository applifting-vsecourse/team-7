import type { DogProfile } from "../api/dogProfileQueryOptions";
import { Alert } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api-client";

import { LibraryItemDialog } from "@/features/disciplines/components/LibraryItemDialog";
import type { LibraryItemValues } from "@/features/disciplines/schemas/libraryItemSchema";

import { useDogProfileMutation } from "../hooks/useDogProfileMutation";

export function NewDogDisciplineDialog({
  dog,
  onClose,
}: {
  dog: DogProfile;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const save = useDogProfileMutation((values: LibraryItemValues) =>
    api
      .post(`dogs/${encodeURIComponent(dog.id)}/disciplines`, {
        json: { name: values.name, description: values.text },
      })
      .json<{ id: string }>(),
  );
  return (
    <LibraryItemDialog
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t(($) => $.dogProfile.newDisciplineTitle, { name: dog.name })}
      description={t(($) => $.dogProfile.newDisciplineDescription, {
        name: dog.name,
      })}
      notice={
        <Alert status="accent">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>
              {t(($) => $.dogProfile.newDisciplineNotice, { name: dog.name })}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      }
      labels={{
        name: t(($) => $.disciplines.disciplineForm.name),
        namePlaceholder: t(($) => $.disciplines.disciplineForm.namePlaceholder),
        text: t(($) => $.disciplines.disciplineForm.text),
        textPlaceholder: t(($) => $.disciplines.disciplineForm.textPlaceholder),
      }}
      submitLabel={t(($) => $.dogProfile.createAndAddGoals)}
      isPending={save.isPending}
      onSubmit={async (values) => {
        const discipline = await save.mutateAsync(values);
        onClose();
        await navigate({
          to: "/dogs/$dogId/disciplines/$disciplineId",
          params: { dogId: dog.id, disciplineId: discipline.id },
        });
      }}
    />
  );
}
