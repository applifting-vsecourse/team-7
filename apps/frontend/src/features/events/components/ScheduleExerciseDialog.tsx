import { useState } from "react";
import { CirclePause } from "@gravity-ui/icons";
import {
  Button,
  Checkbox,
  Disclosure,
  Form,
  Modal,
  Radio,
  RadioGroup,
  toast,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api-client";
import { pluralForm } from "@/lib/plural";
import { cn } from "@/lib/utils";

import { useSession } from "@/features/auth/hooks/useSession";
import { dogProfileKey } from "@/features/dogs/api/dogProfileQueryOptions";
import { dogsQueryOptions } from "@/features/dogs/api/dogsQueryOptions";
import { DogAvatar } from "@/features/dogs/components/DogAvatar";
import { QueryFeedback } from "@/features/dogs/components/QueryFeedback";
import { dogAge } from "@/features/dogs/lib/dogAge";
import { isPlannable } from "@/features/dogs/lib/exerciseStatus";

import {
  eventsKey,
  planningExercisesQueryOptions,
  type PlanningExercise,
} from "../api/eventsQueryOptions";
import {
  futureScheduleSchema,
  type ScheduleValues,
} from "../schemas/scheduleSchema";
import { ScheduleFields } from "./ScheduleFields";

export function ScheduleExerciseDialog({
  date,
  onClose,
  initialDogId,
  initialExerciseId,
}: {
  date: Date;
  onClose: () => void;
  initialDogId?: string;
  initialExerciseId?: string;
}) {
  const { t } = useTranslation();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [today] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [step, setStep] = useState(initialDogId ? 2 : 1);
  const [dogId, setDogId] = useState(initialDogId ?? "");
  const [selected, setSelected] = useState<string[]>(
    initialExerciseId ? [initialExerciseId] : [],
  );
  const [selectionError, setSelectionError] = useState(false);
  const dogs = useQuery(dogsQueryOptions(user?.id));
  const exercises = useQuery(planningExercisesQueryOptions(user?.id, dogId));
  const dog = dogs.data?.find((item) => item.id === dogId);
  const selectedExercises = (exercises.data ?? []).filter(
    (item) =>
      selected.includes(item.id) && isPlannable(item.goalStatus, item.status),
  );
  const form = useForm<ScheduleValues>({
    resolver: zodResolver(futureScheduleSchema),
    defaultValues: { exercises: [] },
  });
  const save = useMutation({
    mutationFn: async (values: ScheduleValues) => {
      await api.post("events", {
        json: {
          dogId,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          exercises: values.exercises.map((item) => ({
            exerciseId: item.exerciseId,
            startsAt: new Date(`${item.date}T${item.time}`).toISOString(),
            durationMinutes: item.durationMinutes,
          })),
        },
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: eventsKey(user?.id) }),
        queryClient.invalidateQueries({ queryKey: dogProfileKey(user?.id) }),
      ]);
      toast.success(t(($) => $.planning.success));
      onClose();
    },
  });
  const next = () => {
    if (
      (step === 1 && !dog) ||
      (step === 2 && selectedExercises.length === 0)
    ) {
      setSelectionError(true);
      return;
    }
    setSelectionError(false);
    if (step === 2) {
      const previous = form.getValues("exercises");
      form.reset({
        exercises: selectedExercises.map(
          (item) =>
            previous.find((row) => row.exerciseId === item.id) ?? {
              exerciseId: item.id,
              date:
                format(date, "yyyy-MM-dd") < today
                  ? today
                  : format(date, "yyyy-MM-dd"),
              time: "07:15",
              durationMinutes: 10,
            },
        ),
      });
    }
    setStep(step + 1);
  };
  // Paused goals and exercises are listed read-only (Figma S8 / S8b).
  const groups = new Map<
    string,
    {
      name: string;
      goals: Map<
        string,
        { name: string; items: PlanningExercise[]; paused: [string, string][] }
      >;
      pausedGoals: Map<string, string>;
    }
  >();
  for (const item of exercises.data ?? []) {
    if (!groups.has(item.disciplineId)) {
      groups.set(item.disciplineId, {
        name: item.disciplineName,
        goals: new Map(),
        pausedGoals: new Map(),
      });
    }
    const group = groups.get(item.disciplineId)!;
    if (item.goalStatus === "paused") {
      group.pausedGoals.set(item.goalId, item.goalName);
      continue;
    }
    const goal = group.goals.get(item.goalId) ?? {
      name: item.goalName,
      items: [],
      paused: [],
    };
    if (isPlannable(item.goalStatus, item.status)) goal.items.push(item);
    else goal.paused.push([item.id, item.name]);
    group.goals.set(item.goalId, goal);
  }
  const plannableCount = [...groups.values()].reduce(
    (sum, group) =>
      sum +
      [...group.goals.values()].reduce((n, goal) => n + goal.items.length, 0),
    0,
  );
  const toggle = (ids: string[], checked: boolean) => {
    setSelected((previous) =>
      checked
        ? [...new Set([...previous, ...ids])]
        : previous.filter((id) => !ids.includes(id)),
    );
    setSelectionError(false);
  };
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
        <Modal.Dialog className="bg-background sm:max-w-160">
          <Modal.CloseTrigger
            isDisabled={save.isPending}
            aria-label={t(($) => $.planning.cancel)}
          />
          <Modal.Header>
            <Modal.Heading className="text-2xl font-semibold tracking-tight">
              {t(($) => $.calendar.scheduleExercise)}
            </Modal.Heading>
          </Modal.Header>
          <Form
            validationBehavior="aria"
            onSubmit={(event) => {
              if (step !== 3) {
                event.preventDefault();
                next();
              } else {
                void form.handleSubmit((values) => save.mutate(values))(event);
              }
            }}
          >
            <Modal.Body className="flex flex-col gap-5">
              <div className="flex flex-col gap-2" aria-live="polite">
                <p className="text-xs font-medium text-muted">
                  {step === 1
                    ? t(($) => $.planning.stepDog)
                    : step === 2
                      ? t(($) => $.planning.stepExercises)
                      : t(($) => $.planning.stepTimes)}
                </p>
                <div className="flex gap-1" aria-hidden="true">
                  {[1, 2, 3].map((value) => (
                    <span
                      key={value}
                      className={cn(
                        "h-1 flex-1 rounded-full",
                        value <= step ? "bg-accent" : "bg-default",
                      )}
                    />
                  ))}
                </div>
              </div>
              {step === 1 ? (
                <>
                  <QueryFeedback query={dogs} />
                  {dogs.isSuccess && dogs.data.length === 0 && (
                    <p className="text-sm text-muted">
                      {t(($) => $.planning.noDogs)}
                    </p>
                  )}
                  <RadioGroup
                    aria-label={t(($) => $.planning.dog)}
                    value={dogId}
                    onChange={(id) => {
                      setDogId(id);
                      setSelected([]);
                      form.reset({ exercises: [] });
                      setSelectionError(false);
                    }}
                    className="gap-2"
                  >
                    {dogs.data?.map((item) => {
                      const age = dogAge(item.birthDate);
                      const ageText = age
                        ? t(
                            ($) =>
                              age.unit === "years"
                                ? $.dogs.ageYears[pluralForm(age.count)]
                                : $.dogs.ageMonths[pluralForm(age.count)],
                            { count: age.count },
                          )
                        : null;
                      return (
                        <Radio key={item.id} value={item.id} className="w-full">
                          <Radio.Content className="w-full cursor-pointer gap-3 rounded-3xl bg-surface p-4 shadow-card data-[selected=true]:bg-default">
                            <Radio.Control>
                              <Radio.Indicator />
                            </Radio.Control>
                            <DogAvatar dog={item} />
                            <span className="flex min-w-0 flex-col gap-1">
                              <span className="text-sm font-medium">
                                {item.name}
                              </span>
                              <span className="text-xs text-muted">
                                {[item.breed, ageText]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            </span>
                          </Radio.Content>
                        </Radio>
                      );
                    })}
                  </RadioGroup>
                </>
              ) : (
                <>
                  {dog && (
                    <div className="flex w-fit min-w-48 items-center gap-3 rounded-3xl bg-default px-3 py-1.5">
                      <DogAvatar dog={dog} />
                      <span className="text-sm font-medium">{dog.name}</span>
                    </div>
                  )}
                  {step === 2 ? (
                    <>
                      <QueryFeedback query={exercises} />
                      {exercises.isSuccess && plannableCount === 0 && (
                        <p className="text-sm text-muted">
                          {t(($) => $.planning.noExercises)}
                        </p>
                      )}
                      {[...groups].map(([id, group], index) => (
                        <Disclosure key={id} defaultExpanded={index === 0}>
                          <Disclosure.Heading>
                            <Disclosure.Trigger className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                              {group.name}
                              <Disclosure.Indicator />
                            </Disclosure.Trigger>
                          </Disclosure.Heading>
                          <Disclosure.Content>
                            <div className="flex flex-col gap-2 pt-4">
                              {[...group.goals].map(([goalId, goal]) => {
                                const { items } = goal;
                                const count = items.filter((item) =>
                                  selected.includes(item.id),
                                ).length;
                                return (
                                  <div
                                    key={goalId}
                                    className="flex flex-col gap-2 rounded-3xl bg-surface p-4 shadow-card"
                                  >
                                    {items.length ? (
                                      <Checkbox
                                        isSelected={count === items.length}
                                        isIndeterminate={
                                          count > 0 && count < items.length
                                        }
                                        onChange={(checked) =>
                                          toggle(
                                            items.map((item) => item.id),
                                            checked,
                                          )
                                        }
                                      >
                                        <Checkbox.Content>
                                          <Checkbox.Control>
                                            <Checkbox.Indicator />
                                          </Checkbox.Control>
                                          <span className="font-semibold">
                                            {goal.name}
                                          </span>
                                        </Checkbox.Content>
                                      </Checkbox>
                                    ) : (
                                      // Every exercise is paused: nothing to select.
                                      <span className="font-semibold">
                                        {goal.name}
                                      </span>
                                    )}
                                    <div className="flex flex-col gap-2 pl-8">
                                      {items.map((item) => (
                                        <Checkbox
                                          key={item.id}
                                          isSelected={selected.includes(
                                            item.id,
                                          )}
                                          onChange={(checked) =>
                                            toggle([item.id], checked)
                                          }
                                        >
                                          <Checkbox.Content>
                                            <Checkbox.Control>
                                              <Checkbox.Indicator />
                                            </Checkbox.Control>
                                            <span className="text-sm">
                                              {item.name}
                                            </span>
                                          </Checkbox.Content>
                                        </Checkbox>
                                      ))}
                                      {goal.paused.length > 0 && (
                                        // Figma S8b 622:91637 "Show paused".
                                        <PausedGroup
                                          title={t(
                                            ($) => $.status.pausedExercises,
                                            { count: goal.paused.length },
                                          )}
                                          items={goal.paused}
                                        />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {group.pausedGoals.size > 0 && (
                                // Figma S8 621:52343: below the goal cards.
                                <PausedGroup
                                  title={t(($) => $.status.pausedGoals, {
                                    count: group.pausedGoals.size,
                                  })}
                                  items={[...group.pausedGoals]}
                                />
                              )}
                            </div>
                          </Disclosure.Content>
                        </Disclosure>
                      ))}
                    </>
                  ) : (
                    <div className="flex flex-col gap-8">
                      {selectedExercises.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 sm:flex-row sm:items-start"
                        >
                          <div className="min-w-0 sm:w-50 sm:shrink-0">
                            {/* One step above the field labels (text-sm), so
                                each exercise reads as the heading of its fields. */}
                            <h3 className="text-lg leading-7 font-medium tracking-tight wrap-break-word">
                              {item.name}
                            </h3>
                            <p className="text-sm leading-6 text-muted">
                              {item.disciplineName} · {item.goalName}
                            </p>
                          </div>
                          <ScheduleFields
                            control={form.control}
                            index={index}
                            isDisabled={save.isPending}
                            minDate={today}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              {selectionError && (
                <p role="alert" className="text-sm text-danger">
                  {step === 1
                    ? t(($) => $.planning.chooseDog)
                    : t(($) => $.planning.chooseExercises)}
                </p>
              )}
              {save.isError && (
                <p role="alert" className="text-sm text-danger">
                  {t(($) => $.planning.error)}
                </p>
              )}
            </Modal.Body>
            <Modal.Footer className="flex-wrap">
              <Button
                type="button"
                variant="secondary"
                isDisabled={save.isPending}
                className="flex-auto sm:flex-none"
                onPress={() => {
                  if (step === 1) onClose();
                  else {
                    setSelectionError(false);
                    setStep(step - 1);
                  }
                }}
              >
                {step === 1
                  ? t(($) => $.planning.cancel)
                  : t(($) => $.planning.back)}
              </Button>
              <Button
                type="submit"
                isPending={save.isPending}
                isDisabled={save.isPending}
                className="flex-auto sm:flex-none"
              >
                {step === 3
                  ? t(($) => $.planning.schedule, {
                      count: selectedExercises.length,
                    })
                  : t(($) => $.planning.next)}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

/** Read-only names of paused goals / exercises; collapsed, as secondary information. */
function PausedGroup({
  title,
  items,
}: {
  title: string;
  items: [id: string, name: string][];
}) {
  return (
    <Disclosure>
      <Disclosure.Heading>
        {/* The kit's trigger is inline-block; keep title and chevron in one row. */}
        <Disclosure.Trigger className="inline-flex items-center gap-2 text-sm font-medium text-muted">
          {title}
          <Disclosure.Indicator />
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <ul className="flex flex-col gap-2 pt-2">
          {items.map(([id, name]) => (
            <li
              key={id}
              className="flex items-center gap-2 text-sm font-medium text-muted"
            >
              <CirclePause className="size-3.5 shrink-0" aria-hidden="true" />
              {name}
            </li>
          ))}
        </ul>
      </Disclosure.Content>
    </Disclosure>
  );
}
