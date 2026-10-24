import { useState } from "react";
import {
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
import {
  disciplineQueryOptions,
  disciplinesQueryOptions,
} from "@/features/disciplines/api/disciplinesQueryOptions";

import {
  dogDisciplinePath,
  type DogProfile,
  type GoalSelection,
} from "../api/dogProfileQueryOptions";
import { useDogProfileMutation } from "../hooks/useDogProfileMutation";
import { GoalPicker } from "./GoalPicker";
import { QueryFeedback } from "./QueryFeedback";

export function AssignDisciplineDialog({
  dog,
  onClose,
}: {
  dog: DogProfile;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { user } = useSession();
  const [step, setStep] = useState(1);
  const [disciplineId, setDisciplineId] = useState("");
  const [selection, setSelection] = useState<GoalSelection[]>([]);
  const library = useQuery(disciplinesQueryOptions(user?.id));
  const detail = useQuery(disciplineQueryOptions(user?.id, disciplineId));
  const available =
    library.data?.filter(
      (item) =>
        item.goalCount > 0 &&
        !dog.disciplines.some((assigned) => assigned.id === item.id),
    ) ?? [];
  const save = useDogProfileMutation(async () => {
    await api.put(`${dogDisciplinePath(dog.id, disciplineId)}/selection`, {
      json: { goals: selection },
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
      <Modal.Container size="lg">
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
              {step === 1
                ? t(($) => $.dogProfile.chooseDiscipline, { name: dog.name })
                : t(($) => $.dogProfile.chooseGoals, { name: dog.name })}
            </p>
            {step === 1 ? (
              <>
                <QueryFeedback query={library} />
                {library.isSuccess && (
                  <>
                    {available.length === 0 ? (
                      <p className="text-sm text-muted">
                        {t(($) => $.dogProfile.noAvailableDisciplines)}
                      </p>
                    ) : (
                      <RadioGroup
                        aria-label={t(($) => $.navigation.disciplines)}
                        value={disciplineId}
                        onChange={(value) => {
                          setDisciplineId(value);
                          setSelection([]);
                        }}
                      >
                        {available.map((discipline) => (
                          <DisciplineRadio
                            key={discipline.id}
                            discipline={discipline}
                          />
                        ))}
                      </RadioGroup>
                    )}
                    <Alert status="accent">
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Description>
                          {t(($) => $.dogProfile.libraryNotice)}
                        </Alert.Description>
                      </Alert.Content>
                    </Alert>
                  </>
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
                          setSelection(
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
                          setSelection((current) => [
                            ...current.filter(
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
          <Modal.Footer className="flex-col-reverse sm:flex-row">
            <Button
              variant="secondary"
              isDisabled={save.isPending}
              className="w-full sm:w-auto"
              onPress={() => (step === 1 ? onClose() : setStep(1))}
            >
              {step === 1
                ? t(($) => $.dogs.cancel)
                : t(($) => $.dogProfile.previousStep)}
            </Button>
            <Button
              isDisabled={
                step === 1
                  ? !disciplineId
                  : selection.length === 0 ||
                    !detail.isSuccess ||
                    save.isPending
              }
              isPending={save.isPending}
              className="w-full sm:w-auto"
              onPress={async () => {
                if (step === 1) {
                  setStep(2);
                  return;
                }
                try {
                  await save.mutateAsync();
                  toast.success(t(($) => $.dogProfile.assignedToast));
                  onClose();
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

function DisciplineRadio({
  discipline,
}: {
  discipline: {
    id: string;
    name: string;
    goalCount: number;
    exerciseCount: number;
  };
}) {
  const { t } = useTranslation();
  return (
    <Radio
      value={discipline.id}
      className="rounded-3xl bg-surface p-4 shadow-card"
    >
      <Radio.Content>
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        <span className="text-sm font-medium">{discipline.name}</span>
      </Radio.Content>
      <Description className="pl-7">
        {t(($) => $.disciplines.goalsSummary, {
          goals: t(
            ($) => $.disciplines.goalCount[pluralForm(discipline.goalCount)],
            { count: discipline.goalCount },
          ),
          exercises: t(
            ($) =>
              $.disciplines.exerciseCount[pluralForm(discipline.exerciseCount)],
            { count: discipline.exerciseCount },
          ),
        })}
      </Description>
    </Radio>
  );
}
