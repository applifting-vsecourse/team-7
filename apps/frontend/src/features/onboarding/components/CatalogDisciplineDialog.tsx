import { useState } from "react";
import { Button, Modal, RadioGroup } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api-client";

import type {
  DogProfile,
  GoalSelection,
} from "@/features/dogs/api/dogProfileQueryOptions";
import {
  DisciplineRadio,
  useGoalsSummary,
} from "@/features/dogs/components/AssignDisciplineDialog";
import { GoalPicker } from "@/features/dogs/components/GoalPicker";
import { QueryFeedback } from "@/features/dogs/components/QueryFeedback";
import { useDogProfileMutation } from "@/features/dogs/hooks/useDogProfileMutation";

import { catalogQueryOptions } from "../api/onboardingQueryOptions";
import { useTour } from "../hooks/useTour";

const CUSTOM = "custom";

/**
 * Figma O5 "Výběr disciplíny": the tour's discipline dialog. A prefilled
 * discipline is copied into the handler's library and assigned in one save;
 * "Your own discipline" hands over to the new-discipline dialog.
 */
export function CatalogDisciplineDialog({
  dog,
  onClose,
  onCustom,
}: {
  dog: DogProfile;
  onClose: () => void;
  onCustom: () => void;
}) {
  const { t, i18n } = useTranslation();
  const lng = i18n.resolvedLanguage === "en" ? "en" : "cs";
  const tour = useTour();
  const summary = useGoalsSummary();
  const catalog = useQuery(catalogQueryOptions(lng));
  const [step, setStep] = useState(1);
  const [key, setKey] = useState("obedience");
  const [selection, setSelection] = useState<GoalSelection[]>([]);
  const discipline = catalog.data?.find((item) => item.key === key);
  const save = useDogProfileMutation(async () => {
    await api.post(`onboarding/catalog/${key}`, {
      json: { dogId: dog.id, lng, goals: selection },
    });
  });
  const exerciseCount = selection.reduce(
    (total, goal) => total + goal.exerciseIds.length,
    0,
  );

  return (
    <Modal.Backdrop
      isOpen
      onOpenChange={(open) => {
        if (!open && !save.isPending) onClose();
      }}
      isDismissable={!save.isPending}
      isKeyboardDismissDisabled={save.isPending}
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
            {step === 1 ? (
              <>
                <p className="text-sm leading-6">
                  {t(($) => $.onboarding.catalog.intro)}
                </p>
                <QueryFeedback query={catalog} />
                {catalog.isSuccess && (
                  <RadioGroup
                    aria-label={t(($) => $.navigation.disciplines)}
                    value={key}
                    onChange={(value) => {
                      setKey(value);
                      setSelection([]);
                    }}
                  >
                    {catalog.data.map((item) => (
                      <DisciplineRadio
                        key={item.key}
                        value={item.key}
                        name={item.name}
                        description={t(($) => $.onboarding.catalog.prefilled, {
                          summary: summary(
                            item.goals.length,
                            item.goals.reduce(
                              (total, goal) => total + goal.exercises.length,
                              0,
                            ),
                          ),
                        })}
                      />
                    ))}
                    <DisciplineRadio
                      value={CUSTOM}
                      name={t(($) => $.onboarding.catalog.custom)}
                      description={t(($) => $.onboarding.catalog.customHint)}
                    />
                  </RadioGroup>
                )}
              </>
            ) : (
              discipline && (
                <>
                  <p className="text-sm leading-6">
                    {t(($) => $.dogProfile.chooseGoals, { name: dog.name })}
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold tracking-tight">
                      {discipline.name}
                    </h2>
                    <Button
                      size="sm"
                      variant="outline"
                      isDisabled={save.isPending}
                      onPress={() =>
                        setSelection(
                          discipline.goals.map((goal) => ({
                            goalId: goal.id,
                            exerciseIds: goal.exercises.map((item) => item.id),
                          })),
                        )
                      }
                    >
                      {t(($) => $.dogProfile.selectAll)}
                    </Button>
                  </div>
                  {discipline.goals.map((goal) => (
                    <GoalPicker
                      key={goal.id}
                      goal={{
                        ...goal,
                        criterion: null,
                        dogs: [],
                        exercises: goal.exercises.map((item) => ({
                          ...item,
                          procedure: null,
                          dogCount: 0,
                        })),
                      }}
                      isDisabled={save.isPending}
                      selection={selection.find(
                        (item) => item.goalId === goal.id,
                      )}
                      onChange={(item) =>
                        setSelection((current) => [
                          ...current.filter(
                            (other) => other.goalId !== goal.id,
                          ),
                          ...(item ? [item] : []),
                        ])
                      }
                    />
                  ))}
                </>
              )
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
              isDisabled={save.isPending}
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
                  ? !catalog.isSuccess
                  : selection.length === 0 || save.isPending
              }
              isPending={save.isPending}
              className="flex-auto sm:flex-none"
              onPress={async () => {
                if (step === 1) {
                  if (key === CUSTOM) onCustom();
                  else setStep(2);
                  return;
                }
                try {
                  await save.mutateAsync();
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
