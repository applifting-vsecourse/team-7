import { useState } from "react";
import type { DisciplineDetail, Goal } from "../api/disciplinesQueryOptions";
import {
  Alert,
  Button,
  Checkbox,
  Description,
  Label,
  Modal,
  ProgressBar,
  Radio,
  RadioGroup,
  toast,
} from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@/app/routes";
import { czechFrom, pluralForm } from "@/lib/plural";

import { useSession } from "@/features/auth/hooks/useSession";
import type { Dog } from "@/features/dogs/api/dogsQueryOptions";
import { DogAvatar } from "@/features/dogs/components/DogAvatar";
import { useDogs } from "@/features/dogs/hooks/useDogs";
import { dogAge } from "@/features/dogs/lib/dogAge";

import {
  useAssignDiscipline,
  type AssignedGoal,
} from "../hooks/useLibraryMutations";

type AssignDogDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  discipline: DisciplineDetail;
};

/** Two steps: pick a dog that doesn't train the discipline, then its goals. */
export function AssignDogDialog({
  isOpen,
  onOpenChange,
  discipline,
}: AssignDogDialogProps) {
  const { t } = useTranslation();
  const assign = useAssignDiscipline();

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (assign.isPending) return;
        assign.reset();
        onOpenChange(open);
      }}
      isDismissable={!assign.isPending}
      isKeyboardDismissDisabled={assign.isPending}
    >
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-160">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>
              {t(($) => $.disciplines.assignDialog.title)}
            </Modal.Heading>
          </Modal.Header>
          {isOpen ? (
            <AssignSteps
              discipline={discipline}
              assign={assign}
              onClose={() => onOpenChange(false)}
            />
          ) : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function AssignSteps({
  discipline,
  assign,
  onClose,
}: {
  discipline: DisciplineDetail;
  assign: ReturnType<typeof useAssignDiscipline>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSession();
  const dogsQuery = useDogs(user?.id);
  const assignedIds = new Set(discipline.dogs.map((dog) => dog.id));
  const availableDogs =
    dogsQuery.data?.filter((dog) => !assignedIds.has(dog.id)) ?? [];
  const [dogId, setDogId] = useState<string | null>(null);
  const [step, setStep] = useState<"dog" | "goals">("dog");
  // Preselect the first dog so the common case is one click.
  const selectedDog =
    availableDogs.find((dog) => dog.id === dogId) ?? availableDogs[0];

  const submit = (dog: Dog, goals: AssignedGoal[]) => {
    const exerciseCount = goals.reduce(
      (sum, goal) => sum + goal.exerciseIds.length,
      0,
    );
    assign.mutate(
      { disciplineId: discipline.id, dogId: dog.id, goals },
      {
        onSuccess: () => {
          onClose();
          const goalsText = t(
            ($) => $.disciplines.goalCount[pluralForm(goals.length)],
            { count: goals.length },
          );
          const form = pluralForm(goals.length);
          const id = toast.success(
            t(($) => $.disciplines.assignDialog.toastTitle, {
              discipline: discipline.name,
              dog: dog.name,
            }),
            {
              description:
                exerciseCount > 0
                  ? t(
                      ($) => $.disciplines.assignDialog.toastDescription[form],
                      {
                        goals: goalsText,
                        exercises: t(
                          ($) =>
                            $.disciplines.exerciseCount[
                              pluralForm(exerciseCount)
                            ],
                          { count: exerciseCount },
                        ),
                      },
                    )
                  : t(
                      ($) =>
                        $.disciplines.assignDialog.toastDescriptionGoalsOnly[
                          form
                        ],
                      { goals: goalsText },
                    ),
              actionProps: {
                children: t(($) => $.disciplines.assignDialog.goToDog),
                onPress: () => {
                  toast.close(id);
                  void navigate({
                    to: ROUTES.dog,
                    params: { dogId: dog.id },
                  });
                },
              },
            },
          );
        },
      },
    );
  };

  if (step === "goals" && selectedDog) {
    return (
      <GoalsStep
        discipline={discipline}
        dog={selectedDog}
        isPending={assign.isPending}
        isError={assign.isError}
        onBack={() => {
          assign.reset();
          setStep("dog");
        }}
        onSubmit={(goals) => submit(selectedDog, goals)}
      />
    );
  }

  return (
    <>
      <Modal.Body className="flex flex-col gap-5">
        <Steps step={1} />
        <p className="text-sm leading-6">
          {t(($) => $.disciplines.assignDialog.pickDog, {
            discipline: discipline.name,
          })}
        </p>
        {dogsQuery.isPending ? (
          <p role="status" className="text-sm text-muted">
            {t(($) => $.dogs.loading)}
          </p>
        ) : dogsQuery.isError ? (
          <div role="alert" className="flex flex-col items-start gap-3">
            <p className="text-sm text-danger">{t(($) => $.dogs.loadError)}</p>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => void dogsQuery.refetch()}
            >
              {t(($) => $.dogs.retry)}
            </Button>
          </div>
        ) : availableDogs.length === 0 ? (
          <p className="text-sm leading-6 text-muted">
            {dogsQuery.data.length === 0
              ? t(($) => $.disciplines.assignDialog.noDogs)
              : t(($) => $.disciplines.assignDialog.allDogsAssigned)}
          </p>
        ) : (
          <RadioGroup
            aria-label={t(($) => $.disciplines.assignDialog.dogLabel)}
            value={selectedDog?.id ?? null}
            onChange={setDogId}
            className="flex flex-col gap-4"
          >
            {availableDogs.map((dog) => (
              <Radio key={dog.id} value={dog.id}>
                <Radio.Content className="flex w-full items-center gap-3 rounded-3xl bg-surface p-4 shadow-surface">
                  <Radio.Control>
                    <Radio.Indicator />
                  </Radio.Control>
                  <DogAvatar dog={dog} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm leading-6 font-medium wrap-break-word">
                      {dog.name}
                    </span>
                    <DogMeta dog={dog} />
                  </span>
                </Radio.Content>
              </Radio>
            ))}
          </RadioGroup>
        )}
        {assignedIds.size > 0 && availableDogs.length > 0 ? (
          <Alert status="accent">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>
                {t(($) => $.disciplines.assignDialog.hiddenDogs)}
              </Alert.Title>
            </Alert.Content>
          </Alert>
        ) : null}
      </Modal.Body>
      <Modal.Footer className="flex-col-reverse sm:flex-row">
        <Button
          variant="secondary"
          onPress={onClose}
          className="w-full sm:w-auto"
        >
          {t(($) => $.disciplines.cancel)}
        </Button>
        {selectedDog ? (
          <Button onPress={() => setStep("goals")} className="w-full sm:w-auto">
            {t(($) => $.disciplines.assignDialog.continue)}
          </Button>
        ) : null}
      </Modal.Footer>
    </>
  );
}

function Steps({ step }: { step: 1 | 2 }) {
  const { t } = useTranslation();
  return (
    <ProgressBar
      value={step}
      minValue={0}
      maxValue={2}
      size="sm"
      className="flex flex-col gap-2"
    >
      <Label className="text-xs font-medium text-muted">
        {step === 1
          ? t(($) => $.disciplines.assignDialog.stepDog)
          : t(($) => $.disciplines.assignDialog.stepGoals)}
      </Label>
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
  );
}

function DogMeta({ dog }: { dog: Dog }) {
  const { t } = useTranslation();
  const age = dogAge(dog.birthDate);
  const parts = [
    dog.breed,
    age &&
      (age.unit === "years"
        ? t(($) => $.dogs.ageYears[pluralForm(age.count)], { count: age.count })
        : t(($) => $.dogs.ageMonths[pluralForm(age.count)], {
            count: age.count,
          })),
  ].filter(Boolean);

  if (parts.length === 0) return null;
  return (
    <span className="text-xs leading-5 text-muted">{parts.join(" · ")}</span>
  );
}

// Picked exercise IDs per goal; a goal without a key isn't picked.
type Selection = Record<string, string[]>;

const selectAll = (goals: Goal[]): Selection =>
  Object.fromEntries(
    goals.map((goal) => [
      goal.id,
      goal.exercises.map((exercise) => exercise.id),
    ]),
  );

function GoalsStep({
  discipline,
  dog,
  isPending,
  isError,
  onBack,
  onSubmit,
}: {
  discipline: DisciplineDetail;
  dog: Dog;
  isPending: boolean;
  isError: boolean;
  onBack: () => void;
  onSubmit: (goals: AssignedGoal[]) => void;
}) {
  const { t } = useTranslation();
  const [selection, setSelection] = useState<Selection>(() =>
    selectAll(discipline.goals),
  );
  const [showRequired, setShowRequired] = useState(false);
  const picked = Object.entries(selection).map(([goalId, exerciseIds]) => ({
    goalId,
    exerciseIds,
  }));
  const exerciseCount = picked.reduce(
    (sum, goal) => sum + goal.exerciseIds.length,
    0,
  );
  const isAllSelected = discipline.goals.every(
    (goal) => selection[goal.id]?.length === goal.exercises.length,
  );
  const update = (next: Selection) => {
    setSelection(next);
    setShowRequired(false);
  };
  const toggleGoal = (goal: Goal, isSelected: boolean) => {
    const next = { ...selection };
    if (isSelected) {
      next[goal.id] = goal.exercises.map((exercise) => exercise.id);
    } else {
      delete next[goal.id];
    }
    update(next);
  };
  const toggleExercise = (
    goal: Goal,
    exerciseId: string,
    isSelected: boolean,
  ) => {
    const current = selection[goal.id] ?? [];
    // Keep the library order so the request reads like the screen.
    const next = goal.exercises
      .map((exercise) => exercise.id)
      .filter((id) => (id === exerciseId ? isSelected : current.includes(id)));
    update({ ...selection, [goal.id]: next });
  };

  return (
    <>
      <Modal.Body className="flex flex-col gap-5">
        <Steps step={2} />
        <div className="flex items-center gap-3 self-start rounded-full bg-default py-1.5 pr-4 pl-1.5">
          <DogAvatar dog={dog} />
          <span className="text-sm leading-6 font-medium wrap-break-word">
            {dog.name}
          </span>
        </div>
        <p className="text-sm leading-6">
          {t(($) => $.disciplines.assignDialog.pickGoals, { dog: dog.name })}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg leading-7 font-semibold tracking-tight wrap-break-word">
            {discipline.name}
          </h3>
          <Button
            variant="outline"
            isDisabled={isPending}
            onPress={() =>
              update(isAllSelected ? {} : selectAll(discipline.goals))
            }
          >
            {isAllSelected
              ? t(($) => $.disciplines.assignDialog.deselectAll)
              : t(($) => $.disciplines.assignDialog.selectAll)}
          </Button>
        </div>
        <ul className="flex flex-col gap-5">
          {discipline.goals.map((goal) => {
            const exerciseIds = selection[goal.id];
            const total = goal.exercises.length;
            return (
              <li
                key={goal.id}
                className="flex flex-col gap-2 rounded-3xl bg-surface p-4 shadow-surface"
              >
                <Checkbox
                  isSelected={exerciseIds?.length === total}
                  isIndeterminate={
                    exerciseIds !== undefined && exerciseIds.length < total
                  }
                  isDisabled={isPending}
                  onChange={(isSelected) => toggleGoal(goal, isSelected)}
                >
                  <Checkbox.Content className="text-base leading-6 font-semibold wrap-break-word">
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    {goal.name}
                  </Checkbox.Content>
                  {exerciseIds && total > 0 ? (
                    <Description className="pl-7">
                      {t(
                        ($) =>
                          $.disciplines.assignDialog.exercisesSelected[
                            pluralForm(total)
                          ],
                        {
                          count: exerciseIds.length,
                          total,
                          from: czechFrom(total),
                        },
                      )}
                    </Description>
                  ) : null}
                </Checkbox>
                {exerciseIds && total > 0 ? (
                  <ul className="flex flex-col gap-2 pl-7">
                    {goal.exercises.map((exercise) => (
                      <li key={exercise.id}>
                        <Checkbox
                          isSelected={exerciseIds.includes(exercise.id)}
                          isDisabled={isPending}
                          onChange={(isSelected) =>
                            toggleExercise(goal, exercise.id, isSelected)
                          }
                        >
                          <Checkbox.Content className="text-sm leading-6 font-medium wrap-break-word">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            {exercise.name}
                          </Checkbox.Content>
                        </Checkbox>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
        {showRequired ? (
          <p role="alert" className="text-sm text-danger">
            {t(($) => $.disciplines.assignDialog.goalsRequired)}
          </p>
        ) : isError ? (
          <p role="alert" className="text-sm text-danger">
            {t(($) => $.disciplines.assignDialog.error)}
          </p>
        ) : null}
      </Modal.Body>
      <Modal.Footer className="flex-col-reverse sm:flex-row">
        <Button
          variant="secondary"
          isDisabled={isPending}
          onPress={onBack}
          className="w-full sm:w-auto"
        >
          {t(($) => $.disciplines.assignDialog.back)}
        </Button>
        <Button
          isPending={isPending}
          isDisabled={isPending}
          onPress={() => {
            if (picked.length === 0) {
              setShowRequired(true);
              return;
            }
            onSubmit(picked);
          }}
          className="w-full sm:w-auto"
        >
          {picked.length === 0
            ? t(($) => $.disciplines.assignDialog.submitEmpty)
            : t(($) => $.disciplines.assignDialog.submit, {
                goals: t(
                  ($) => $.disciplines.goalCount[pluralForm(picked.length)],
                  { count: picked.length },
                ),
                exercises: t(
                  ($) => $.disciplines.exerciseCount[pluralForm(exerciseCount)],
                  { count: exerciseCount },
                ),
              })}
        </Button>
      </Modal.Footer>
    </>
  );
}
