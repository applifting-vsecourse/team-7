import { useId, useState } from "react";
import {
  Accordion,
  Alert,
  Button,
  Description,
  Modal,
  Radio,
  RadioGroup,
  toast,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api-client";
import { pluralForm } from "@/lib/plural";

import { useSession } from "@/features/auth/hooks/useSession";
import { CategoryTrigger } from "@/features/catalog/components/CategoryTrigger";
import {
  disciplineQueryOptions,
  disciplinesQueryOptions,
} from "@/features/disciplines/api/disciplinesQueryOptions";
import {
  catalogExerciseCount,
  useCatalog,
} from "@/features/disciplines/hooks/useCatalog";
import { useCopyCatalogDiscipline } from "@/features/disciplines/hooks/useLibraryMutations";
import { useTour } from "@/features/onboarding/hooks/useTour";
import {
  useSubscription,
  usePlusOffer,
} from "@/features/subscription/hooks/useSubscription";

import {
  dogDisciplinePath,
  type DogProfile,
  type GoalSelection,
} from "../api/dogProfileQueryOptions";
import { useDogProfileMutation } from "../hooks/useDogProfileMutation";
import { GoalPicker } from "./GoalPicker";
import { QueryFeedback } from "./QueryFeedback";

const CUSTOM = "custom";
// Quiet subhead for the "library" and "catalog" groups of step 1.
const LABEL = "text-sm leading-6 font-semibold";
// A catalog discipline that isn't in the library yet; copied on Continue.
const CATALOG = "catalog:";

type Option = {
  value: string;
  name: string;
  description: string;
  isDisabled?: boolean;
};

export function AssignDisciplineDialog({
  dog,
  onClose,
  onCustom,
}: {
  dog: DogProfile;
  onClose: () => void;
  /**
   * The tour's variant (Figma O5): the library and the catalog plus "Your own
   * discipline", which hands over to the new-discipline dialog.
   */
  onCustom?: () => void;
}) {
  const { t } = useTranslation();
  const { user } = useSession();
  const summary = useGoalsSummary();
  const subscription = useSubscription();
  const offer = usePlusOffer();
  const selectGoals = (next: GoalSelection[]) => {
    if (
      subscription.data &&
      subscription.data.goalLimit !== null &&
      subscription.data.goals + next.length > subscription.data.goalLimit &&
      next.length > selection.length
    ) {
      offer({ reason: "goals", onSuccess: () => setSelection(next) });
    } else setSelection(next);
  };
  const [step, setStep] = useState(1);
  const tour = useTour();
  const id = useId();
  const [picked, setPicked] = useState("");
  const [selection, setSelection] = useState<GoalSelection[]>([]);
  const library = useQuery(disciplinesQueryOptions(user?.id));
  const catalog = useCatalog();
  const copy = useCopyCatalogDiscipline();
  const isAssigned = (id: string) =>
    dog.disciplines.some((assigned) => assigned.id === id);
  const available =
    library.data?.filter(
      (item) => item.goalCount > 0 && !isAssigned(item.id),
    ) ?? [];
  const libraryOptions: Option[] = available.map((discipline) => ({
    value: discipline.id,
    name: discipline.name,
    description: summary(discipline.goalCount, discipline.exerciseCount),
  }));
  // A catalog discipline copied before is the library one: picking it
  // assigns that copy instead of making another.
  const catalogOptions = (index: number): Option[] =>
    (catalog.data?.[index]?.disciplines ?? []).map((discipline) => {
      const copied = library.data?.find(
        (item) => item.catalogKey === discipline.key,
      );
      if (!copied) {
        return {
          value: CATALOG + discipline.key,
          name: discipline.name,
          description: t(($) => $.dogProfile.fromCatalog, {
            summary: summary(
              discipline.goals.length,
              catalogExerciseCount(discipline),
            ),
          }),
        };
      }
      const assigned = isAssigned(copied.id);
      return {
        value: copied.id,
        name: copied.name,
        description: assigned
          ? t(($) => $.dogProfile.alreadyAssigned, { name: dog.name })
          : copied.goalCount === 0
            ? t(($) => $.disciplines.emptyDiscipline)
            : t(($) => $.dogProfile.inLibrary, {
                summary: summary(copied.goalCount, copied.exerciseCount),
              }),
        isDisabled: assigned || copied.goalCount === 0,
      };
    });
  const isReady = library.isSuccess && !catalog.isPending;
  const firstCategory = catalog.data?.[0];
  // The tour starts with the first option picked, as in Figma O5; with
  // nothing to assign from the library, in the first catalog category.
  const startInCatalog =
    Boolean(onCustom) && available.length === 0 && Boolean(firstCategory);
  const firstOption = startInCatalog
    ? catalogOptions(0).find((option) => !option.isDisabled)?.value
    : available[0]?.id;
  const disciplineId =
    picked || (onCustom && isReady ? (firstOption ?? CUSTOM) : "");
  const detail = useQuery(
    disciplineQueryOptions(
      user?.id,
      disciplineId === CUSTOM || disciplineId.startsWith(CATALOG)
        ? ""
        : disciplineId,
    ),
  );
  const save = useDogProfileMutation(async () => {
    await api.put(`${dogDisciplinePath(dog.id, disciplineId)}/selection`, {
      json: { goals: selection },
    });
  });
  const isBusy = save.isPending || copy.isPending;
  const options = (items: Option[], withCustom = false) => (
    <RadioGroup
      aria-label={t(($) => $.navigation.disciplines)}
      value={disciplineId}
      onChange={(value) => {
        setPicked(value);
        setSelection([]);
        copy.reset();
      }}
    >
      {items.map((option) => (
        <DisciplineRadio key={option.value} {...option} />
      ))}
      {withCustom && onCustom && (
        <DisciplineRadio
          value={CUSTOM}
          name={t(($) => $.onboarding.disciplineDialog.custom)}
          description={t(($) => $.onboarding.disciplineDialog.customHint)}
        />
      )}
    </RadioGroup>
  );
  const exerciseCount = selection.reduce(
    (total, goal) => total + goal.exerciseIds.length,
    0,
  );
  return (
    <Modal.Backdrop
      isOpen
      onOpenChange={(open) => {
        if (!open && !isBusy) onClose();
      }}
      isDismissable={!isBusy}
      isKeyboardDismissDisabled={isBusy}
    >
      <Modal.Container size="lg" scroll="outside">
        <Modal.Dialog className="sm:max-w-160">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>
              {t(($) => $.dogProfile.assignDiscipline)}
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted">
                {step === 1
                  ? t(($) => $.dogProfile.stepOne)
                  : t(($) => $.dogProfile.stepTwo)}
              </p>
              <div className="flex gap-1" aria-hidden="true">
                <span className="h-1 flex-1 rounded-full bg-accent" />
                <span
                  className={`h-1 flex-1 rounded-full ${step === 2 ? "bg-accent" : "bg-default"}`}
                />
              </div>
            </div>
            <p className="text-sm leading-6">
              {step === 2
                ? t(($) => $.dogProfile.chooseGoals, { name: dog.name })
                : onCustom
                  ? t(($) => $.onboarding.disciplineDialog.intro)
                  : t(($) => $.dogProfile.chooseDiscipline, { name: dog.name })}
            </p>
            {step === 1 ? (
              <>
                <QueryFeedback query={library} />
                {library.isSuccess && (
                  <QueryFeedback
                    query={catalog}
                    errorMessage={t(($) => $.dogProfile.catalogLoadError)}
                  />
                )}
                {isReady && (
                  <section
                    aria-labelledby={`${id}-library`}
                    className="flex flex-col gap-3"
                  >
                    <h3 id={`${id}-library`} className={LABEL}>
                      {t(($) => $.dogProfile.libraryTab)}
                    </h3>
                    {available.length === 0 && (
                      <Alert status="accent">
                        <Alert.Indicator />
                        <Alert.Content>
                          <Alert.Title>
                            {t(($) => $.dogProfile.libraryEmptyHint)}
                          </Alert.Title>
                        </Alert.Content>
                      </Alert>
                    )}
                    {(available.length > 0 || onCustom) &&
                      options(libraryOptions, true)}
                    {!onCustom && available.length > 0 && (
                      <Alert status="accent">
                        <Alert.Indicator />
                        <Alert.Content>
                          <Alert.Title>
                            {t(($) => $.dogProfile.libraryNotice)}
                          </Alert.Title>
                        </Alert.Content>
                      </Alert>
                    )}
                  </section>
                )}
                {isReady && catalog.data && catalog.data.length > 0 && (
                  <section
                    aria-labelledby={`${id}-catalog`}
                    className="flex flex-col gap-1"
                  >
                    <h3 id={`${id}-catalog`} className={LABEL}>
                      {t(($) => $.disciplines.catalog.title)}
                    </h3>
                    {/* Collapsed so the dialog stays calm; the tour opens the
                        category its first option comes from. */}
                    <Accordion
                      defaultExpandedKeys={
                        startInCatalog && firstCategory
                          ? [firstCategory.key]
                          : []
                      }
                    >
                      {catalog.data.map((category, index) => (
                        <Accordion.Item key={category.key} id={category.key}>
                          <Accordion.Heading level={4}>
                            <CategoryTrigger
                              name={category.name}
                              description={category.description}
                            />
                          </Accordion.Heading>
                          <Accordion.Panel>
                            <Accordion.Body>
                              {options(catalogOptions(index))}
                            </Accordion.Body>
                          </Accordion.Panel>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                  </section>
                )}
                {copy.isError && (
                  <p role="alert" className="text-sm text-danger">
                    {t(($) => $.dogProfile.copyError)}
                  </p>
                )}
              </>
            ) : (
              <>
                <QueryFeedback query={detail} />
                {detail.data && (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold tracking-tight">
                        {detail.data.name}
                      </h2>
                      <Button
                        size="sm"
                        variant="outline"
                        isDisabled={save.isPending}
                        onPress={() =>
                          selectGoals(
                            detail.data.goals.map((goal) => ({
                              goalId: goal.id,
                              exerciseIds: goal.exercises.map(
                                (exercise) => exercise.id,
                              ),
                            })),
                          )
                        }
                      >
                        {t(($) => $.dogProfile.selectAll)}
                      </Button>
                    </div>
                    {detail.data.goals.map((goal) => (
                      <GoalPicker
                        key={goal.id}
                        goal={goal}
                        isDisabled={save.isPending}
                        selection={selection.find(
                          (item) => item.goalId === goal.id,
                        )}
                        onChange={(item) =>
                          selectGoals([
                            ...selection.filter(
                              (item) => item.goalId !== goal.id,
                            ),
                            ...(item ? [item] : []),
                          ])
                        }
                      />
                    ))}
                  </>
                )}
              </>
            )}
            {save.isError && (
              <p role="alert" className="text-sm text-danger">
                {t(($) => $.disciplines.saveError)}
              </p>
            )}
          </Modal.Body>
          <Modal.Footer className="flex-wrap">
            <Button
              variant="secondary"
              isDisabled={isBusy}
              className="flex-auto sm:flex-none"
              onPress={() => (step === 1 ? onClose() : setStep(1))}
            >
              {step === 1
                ? t(($) => $.dogs.cancel)
                : t(($) => $.dogProfile.previousStep)}
            </Button>
            <Button
              isDisabled={
                step === 1
                  ? !disciplineId || isBusy
                  : selection.length === 0 ||
                    !detail.isSuccess ||
                    save.isPending
              }
              isPending={isBusy}
              className="flex-auto sm:flex-none"
              onPress={async () => {
                if (step === 1) {
                  if (disciplineId === CUSTOM) return onCustom?.();
                  if (disciplineId.startsWith(CATALOG)) {
                    try {
                      // Resolves once the library holds the copy, so step 2
                      // and a step back find it.
                      const { id } = await copy.mutateAsync({
                        key: disciplineId.slice(CATALOG.length),
                        lng: catalog.lng,
                      });
                      setPicked(id);
                    } catch {
                      return; // The error stays on step 1 for a retry.
                    }
                  }
                  setStep(2);
                  return;
                }
                try {
                  await save.mutateAsync();
                  toast.success(t(($) => $.dogProfile.assignedToast));
                  onClose();
                  tour.complete("assignDiscipline");
                } catch {
                  /* Error stays in the dialog for retry. */
                }
              }}
            >
              {step === 1
                ? t(($) => $.dogProfile.continue)
                : t(($) => $.dogProfile.assignSelection, {
                    goals: selection.length,
                    exercises: exerciseCount,
                  })}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

/** "3 goals · 8 exercises" for a discipline tile. */
export function useGoalsSummary() {
  const { t } = useTranslation();
  return (goals: number, exercises: number) =>
    t(($) => $.disciplines.goalsSummary, {
      goals: t(($) => $.disciplines.goalCount[pluralForm(goals)], {
        count: goals,
      }),
      exercises: t(($) => $.disciplines.exerciseCount[pluralForm(exercises)], {
        count: exercises,
      }),
    });
}

export function DisciplineRadio({
  value,
  name,
  description,
  details,
  isDisabled,
}: {
  value: string;
  name: string;
  description: string;
  /** Longer text under the name, clamped (the catalog's description). */
  details?: string;
  isDisabled?: boolean;
}) {
  const id = useId();
  return (
    // The card is the Radio.Content (the clickable label), so the whole tile,
    // description included, selects the discipline.
    <Radio
      value={value}
      isDisabled={isDisabled}
      className="w-full"
      // Name only; the summary is the description.
      aria-labelledby={`${id}-name`}
      aria-describedby={`${id}-summary`}
    >
      <Radio.Content className="flex w-full items-start gap-3 rounded-3xl bg-surface p-4 shadow-card">
        {/* mt-1 centres the 16px control on the name's 24px line. */}
        <Radio.Control className="mt-1">
          <Radio.Indicator />
        </Radio.Control>
        <span className="flex min-w-0 flex-col">
          <span id={`${id}-name`} className="text-sm leading-6 font-medium">
            {name}
          </span>
          {details && (
            <span className="line-clamp-2 text-xs leading-5 text-muted">
              {details}
            </span>
          )}
          <Description id={`${id}-summary`}>{description}</Description>
        </span>
      </Radio.Content>
    </Radio>
  );
}
