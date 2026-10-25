import { useState } from "react";
import type { ScheduledEvent } from "../api/eventsQueryOptions";
import type { ScheduleValues } from "../schemas/scheduleSchema";
import {
  Calendar,
  ChevronRight,
  CircleCheck,
  EllipsisVertical,
  Circle,
  Star,
  StarFill,
  TrashBin,
} from "@gravity-ui/icons";
import {
  Button,
  buttonVariants,
  Chip,
  Dropdown,
  FieldError,
  Form,
  Label,
  Modal,
  Radio,
  RadioGroup,
  TextArea,
  TextField,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { format, isBefore, parseISO, startOfDay } from "date-fns";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { translateMessage } from "@/i18n/messages";

import { DogAvatar } from "@/features/dogs/components/DogAvatar";

import { useEventAction } from "../hooks/useEventAction";
import {
  eventResultSchema,
  type EventResultValues,
} from "../schemas/eventResultSchema";
import { futureScheduleSchema } from "../schemas/scheduleSchema";
import { ScheduleFields } from "./ScheduleFields";

export function ScheduledExerciseDialog({
  event,
  onClose,
}: {
  event: ScheduledEvent;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [today] = useState(() => new Date());
  const [mode, setMode] = useState<"result" | "schedule">("result");
  const action = useEventAction(event.id, onClose);
  const completed = Boolean(event.completedAt);
  const overdue = isBefore(parseISO(event.startsAt), startOfDay(today));
  const result = useForm<EventResultValues>({
    resolver: zodResolver(eventResultSchema),
    defaultValues: { rating: event.rating ?? 0, note: event.note ?? "" },
  });
  const schedule = useForm<ScheduleValues>({
    resolver: zodResolver(futureScheduleSchema),
    defaultValues: {
      exercises: [
        {
          exerciseId: event.exercise.id,
          date: format(parseISO(event.startsAt), "yyyy-MM-dd"),
          time: format(parseISO(event.startsAt), "HH:mm"),
          durationMinutes: event.durationMinutes,
        },
      ],
    },
  });
  const rating = useWatch({ control: result.control, name: "rating" });
  const displayDate = parseISO(event.completedAt ?? event.startsAt);
  const when = t(($) => $.training.when, {
    date: new Intl.DateTimeFormat(i18n.resolvedLanguage ?? "cs", {
      weekday: "short",
      day: "numeric",
      month: "numeric",
    }).format(displayDate),
    time: format(displayDate, "HH:mm"),
    duration: event.durationMinutes,
  });
  return (
    <Modal.Backdrop
      isOpen
      isDismissable={!action.isPending}
      isKeyboardDismissDisabled={action.isPending}
      onOpenChange={(open) => {
        if (!open && !action.isPending) onClose();
      }}
    >
      <Modal.Container size="lg" scroll="outside">
        <Modal.Dialog className="bg-background sm:max-w-160">
          <Modal.CloseTrigger
            isDisabled={action.isPending}
            aria-label={t(($) => $.training.cancel)}
          />
          <Modal.Header className="flex-row items-start justify-between gap-3 pr-8">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Modal.Heading className="text-2xl font-semibold tracking-tight">
                {event.exercise.name}
              </Modal.Heading>
              {mode === "result" && (completed || overdue) && (
                <div className="flex flex-wrap items-center gap-2">
                  <Chip color={completed ? "success" : "warning"} size="sm">
                    {completed && (
                      <CircleCheck className="size-3" aria-hidden="true" />
                    )}
                    <Chip.Label>
                      {completed
                        ? t(($) => $.training.completed)
                        : t(($) => $.training.unfinished)}
                    </Chip.Label>
                  </Chip>
                  {completed && (
                    <Link
                      to="/dogs/$dogId/exercises/$exerciseId"
                      params={{
                        dogId: event.dogId,
                        exerciseId: event.exercise.id,
                      }}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      })}
                    >
                      {t(($) => $.training.detail)}
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              )}
            </div>
            {mode === "result" && (
              <Dropdown>
                <Button
                  variant="secondary"
                  isIconOnly
                  size="sm"
                  isDisabled={action.isPending}
                  aria-label={t(($) => $.training.menu)}
                >
                  <EllipsisVertical className="size-4" aria-hidden="true" />
                </Button>
                <Dropdown.Popover>
                  <Dropdown.Menu
                    onAction={(key) => {
                      if (key === "schedule") {
                        action.reset();
                        setMode("schedule");
                      } else if (key === "delete" || key === "reopen") {
                        action.mutate({ type: key });
                      }
                    }}
                  >
                    {completed ? (
                      <Dropdown.Item
                        id="reopen"
                        textValue={
                          overdue
                            ? t(($) => $.training.markUnfinished)
                            : t(($) => $.training.reopen)
                        }
                      >
                        <Circle className="size-4" aria-hidden="true" />
                        <Label>
                          {overdue
                            ? t(($) => $.training.markUnfinished)
                            : t(($) => $.training.reopen)}
                        </Label>
                      </Dropdown.Item>
                    ) : (
                      <Dropdown.Item
                        id="schedule"
                        textValue={t(($) => $.training.move)}
                      >
                        <Calendar className="size-4" aria-hidden="true" />
                        <Label>{t(($) => $.training.move)}</Label>
                      </Dropdown.Item>
                    )}
                    <Dropdown.Item
                      id="delete"
                      variant="danger"
                      className="text-danger"
                      textValue={t(($) => $.training.delete)}
                    >
                      <TrashBin className="size-4" aria-hidden="true" />
                      <Label>{t(($) => $.training.delete)}</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            )}
          </Modal.Header>
          <Form
            validationBehavior="aria"
            onSubmit={(formEvent) => {
              if (mode === "schedule") {
                void schedule.handleSubmit((values) => {
                  const row = values.exercises[0]!;
                  action.mutate({
                    type: "schedule",
                    startsAt: new Date(`${row.date}T${row.time}`).toISOString(),
                    durationMinutes: row.durationMinutes,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  });
                })(formEvent);
              } else if (mode === "result") {
                void result.handleSubmit((values) =>
                  action.mutate({ type: "result", ...values }),
                )(formEvent);
              } else formEvent.preventDefault();
            }}
          >
            <Modal.Body className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <p className="text-base font-medium">{when}</p>
                <p className="text-sm text-muted">
                  {event.exercise.goal.discipline.name} ·{" "}
                  {event.exercise.goal.name}
                </p>
              </div>
              <div className="flex w-fit min-w-48 items-center gap-3 rounded-3xl bg-default px-3 py-1.5">
                <DogAvatar dog={event.dog} />
                <span className="text-sm font-medium">{event.dog.name}</span>
              </div>
              {mode === "schedule" ? (
                <ScheduleFields
                  control={schedule.control}
                  index={0}
                  isDisabled={action.isPending}
                  minDate={format(today, "yyyy-MM-dd")}
                />
              ) : (
                <>
                  <Controller
                    control={result.control}
                    name="rating"
                    render={({ field, fieldState }) => (
                      <RadioGroup
                        isRequired
                        isDisabled={action.isPending}
                        isInvalid={fieldState.invalid}
                        name={field.name}
                        value={String(field.value)}
                        onChange={(value) => field.onChange(Number(value))}
                        onBlur={field.onBlur}
                        orientation="horizontal"
                        className="gap-2"
                      >
                        <Label>{t(($) => $.training.rating)}</Label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((value) => {
                            const Icon = value <= field.value ? StarFill : Star;
                            return (
                              <Radio
                                key={value}
                                value={String(value)}
                                aria-label={t(($) => $.training.star, {
                                  count: value,
                                })}
                              >
                                <Radio.Content>
                                  <Radio.Control className="sr-only">
                                    <Radio.Indicator />
                                  </Radio.Control>
                                  <Icon
                                    className={
                                      value <= field.value
                                        ? "size-6 text-warning"
                                        : "size-6 text-muted"
                                    }
                                    aria-hidden="true"
                                  />
                                </Radio.Content>
                              </Radio>
                            );
                          })}
                        </div>
                        <FieldError>
                          {fieldState.error &&
                            translateMessage(t, fieldState.error.message!)}
                        </FieldError>
                      </RadioGroup>
                    )}
                  />
                  <Controller
                    control={result.control}
                    name="note"
                    render={({ field, fieldState }) => (
                      <TextField
                        isDisabled={action.isPending}
                        isInvalid={fieldState.invalid}
                        name={field.name}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      >
                        <Label>{t(($) => $.training.note)}</Label>
                        <TextArea
                          ref={field.ref}
                          rows={4}
                          placeholder={t(($) => $.training.notePlaceholder)}
                        />
                        <FieldError>
                          {fieldState.error &&
                            translateMessage(t, fieldState.error.message!)}
                        </FieldError>
                      </TextField>
                    )}
                  />
                </>
              )}
              {action.isError && (
                <p role="alert" className="text-sm text-danger">
                  {t(($) => $.training.error)}
                </p>
              )}
            </Modal.Body>
            <Modal.Footer className="flex-col-reverse sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                isDisabled={action.isPending}
                onPress={() => {
                  if (mode === "result") onClose();
                  else {
                    action.reset();
                    setMode("result");
                  }
                }}
              >
                {mode === "result"
                  ? t(($) => $.training.cancel)
                  : t(($) => $.training.back)}
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                isPending={action.isPending}
                isDisabled={action.isPending || (mode === "result" && !rating)}
              >
                {mode === "schedule"
                  ? t(($) => $.training.move)
                  : completed
                    ? t(($) => $.training.save)
                    : t(($) => $.training.complete)}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
