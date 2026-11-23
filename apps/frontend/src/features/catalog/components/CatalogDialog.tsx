import { useState } from "react";
import { Button, Modal, RadioGroup, Tabs, toast } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";

import { useSession } from "@/features/auth/hooks/useSession";
import {
  catalogExerciseCount,
  useCatalog,
} from "@/features/disciplines/hooks/useCatalog";
import { useDisciplines } from "@/features/disciplines/hooks/useDisciplines";
import { useCopyCatalogDiscipline } from "@/features/disciplines/hooks/useLibraryMutations";
import {
  DisciplineRadio,
  useGoalsSummary,
} from "@/features/dogs/components/AssignDisciplineDialog";
import { QueryFeedback } from "@/features/dogs/components/QueryFeedback";

/**
 * Library "Browse catalog" (#14): categories as tabs, their disciplines as
 * tiles. Adding copies the discipline and opens it; one already in the
 * library just opens.
 */
export function CatalogDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSession();
  const summary = useGoalsSummary();
  const catalog = useCatalog();
  const library = useDisciplines(user?.id);
  const copy = useCopyCatalogDiscipline();
  const [tab, setTab] = useState<string | null>(null);
  const [picked, setPicked] = useState("");
  const categories = catalog.data ?? [];
  const value = picked || (categories[0]?.disciplines[0]?.key ?? "");
  const copyOf = (key: string) =>
    library.data?.find((item) => item.catalogKey === key);
  const copied = copyOf(value);
  const discipline = categories
    .flatMap((category) => category.disciplines)
    .find((item) => item.key === value);
  const open = (disciplineId: string) => {
    onClose();
    void navigate({ to: ROUTES.discipline, params: { disciplineId } });
  };

  return (
    <Modal.Backdrop
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen && !copy.isPending) onClose();
      }}
      isDismissable={!copy.isPending}
      isKeyboardDismissDisabled={copy.isPending}
    >
      <Modal.Container size="lg" scroll="outside">
        <Modal.Dialog className="sm:max-w-160">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>
              {t(($) => $.disciplines.catalogDialog.title)}
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-5">
            <p className="text-sm leading-6">
              {t(($) => $.disciplines.catalogDialog.intro)}
            </p>
            <QueryFeedback
              query={catalog}
              errorMessage={t(($) => $.disciplines.catalogDialog.loadError)}
            />
            {categories.length > 0 && (
              <Tabs
                className="tabs--wrap"
                selectedKey={tab ?? categories[0]!.key}
                onSelectionChange={(key) => setTab(String(key))}
              >
                <Tabs.ListContainer>
                  <Tabs.List
                    aria-label={t(
                      ($) => $.disciplines.catalogDialog.categories,
                    )}
                  >
                    {categories.map((category) => (
                      <Tabs.Tab key={category.key} id={category.key}>
                        {category.name}
                        <Tabs.Indicator />
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                </Tabs.ListContainer>
                {categories.map((category) => (
                  <Tabs.Panel
                    key={category.key}
                    id={category.key}
                    className="flex flex-col gap-3"
                  >
                    <p className="text-sm leading-6 text-muted">
                      {category.description}
                    </p>
                    <RadioGroup
                      aria-label={category.name}
                      value={value}
                      onChange={(key) => {
                        setPicked(key);
                        copy.reset();
                      }}
                    >
                      {category.disciplines.map((item) => {
                        const counts = summary(
                          item.goals.length,
                          catalogExerciseCount(item),
                        );
                        return (
                          <DisciplineRadio
                            key={item.key}
                            value={item.key}
                            name={item.name}
                            details={item.description}
                            description={
                              copyOf(item.key)
                                ? t(
                                    ($) =>
                                      $.disciplines.catalogDialog.inLibrary,
                                    { summary: counts },
                                  )
                                : counts
                            }
                          />
                        );
                      })}
                    </RadioGroup>
                  </Tabs.Panel>
                ))}
              </Tabs>
            )}
            {copy.isError && (
              <p role="alert" className="text-sm text-danger">
                {t(($) => $.disciplines.catalogDialog.copyError)}
              </p>
            )}
          </Modal.Body>
          <Modal.Footer className="flex-wrap">
            <Button
              variant="secondary"
              isDisabled={copy.isPending}
              className="flex-auto sm:flex-none"
              onPress={onClose}
            >
              {t(($) => $.disciplines.cancel)}
            </Button>
            <Button
              isDisabled={!discipline || copy.isPending}
              isPending={copy.isPending}
              className="flex-auto sm:flex-none"
              onPress={async () => {
                if (!discipline) return;
                if (copied) return open(copied.id);
                try {
                  const { id } = await copy.mutateAsync({
                    key: discipline.key,
                    lng: catalog.lng,
                  });
                  toast.success(
                    t(($) => $.disciplines.catalogDialog.addedToast, {
                      name: discipline.name,
                    }),
                  );
                  open(id);
                } catch {
                  /* The error stays in the dialog for a retry. */
                }
              }}
            >
              {copied
                ? t(($) => $.disciplines.catalogDialog.open)
                : t(($) => $.disciplines.catalogDialog.add)}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
