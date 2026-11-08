import {
  type CSSProperties,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ScheduledEvent } from "../api/eventsQueryOptions";
import type { ScheduleValues } from "../schemas/scheduleSchema";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronUp,
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
import { cn, transitionName } from "@/lib/utils";

import { ExerciseVideos } from "@/features/videos/components/ExerciseVideos";

import { useEventAction } from "../hooks/useEventAction";
import { isDuplicateDayError } from "../hooks/useMoveEvent";
import {
  eventResultSchema,
  type EventResultValues,
} from "../schemas/eventResultSchema";
import { futureScheduleSchema } from "../schemas/scheduleSchema";
import { ScheduleFields } from "./ScheduleFields";
import { TrainingMeta } from "./TrainingMeta";

export function ScheduledExerciseDialog({
  event,
  onClose,
}: {
  event: ScheduledEvent;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [today] = useState(() => new Date());
  const [mode, setMode] = useState<"result" | "schedule">("result");
  const action = useEventAction(event.id, onClose);
  const lesson = event.kind === "lesson";
  const [videosBusy, setVideosBusy] = useState(false);
  const busy = action.isPending || videosBusy;
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
          // Only keys the form row; a lesson has no exercise and none is sent.
          exerciseId: event.exercise?.id ?? event.id,
          date: format(parseISO(event.startsAt), "yyyy-MM-dd"),
          time: format(parseISO(event.startsAt), "HH:mm"),
          durationMinutes: event.durationMinutes,
        },
      ],
    },
  });
  const rating = useWatch({ control: result.control, name: "rating" });
  // Stars that change animate one after another, counted from the previous rating.
  const [shownRating, setShownRating] = useState(rating);
  const [fillFrom, setFillFrom] = useState(0);
  if (rating !== shownRating) {
    setFillFrom(shownRating);
    setShownRating(rating);
  }
  return (
    <Modal.Backdrop
      isOpen
      isDismissable={!busy}
      isKeyboardDismissDisabled={busy}
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Modal.Container size="lg" scroll="outside" className="grow-from-trigger">
        {/* Shares the tile's name, so the tile grows into this dialog. */}
        <Modal.Dialog
          className="bg-background sm:max-w-160"
          style={transitionName("event", event.id)}
        >
          <Modal.CloseTrigger
            isDisabled={busy}
            aria-label={t(($) => $.training.cancel)}
          />
          <Modal.Header className="flex-row items-start justify-between gap-3 pr-8">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Modal.Heading className="text-2xl font-semibold tracking-tight">
                {event.exercise?.name ?? t(($) => $.lesson.title)}
              </Modal.Heading>
              {mode === "result" && (completed || overdue) && (
                <div className="flex flex-wrap items-center gap-2">
                  <Chip
                    color={completed ? "success" : "warning"}
                    variant="soft"
                    size="lg"
                  >
                    {completed && (
                      <CircleCheck className="size-3.5" aria-hidden="true" />
                    )}
                    <Chip.Label>
                      {completed
                        ? t(($) => $.training.completed)
                        : t(($) => $.training.unfinished)}
                    </Chip.Label>
                  </Chip>
                  {completed && event.exercise && (
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
                  variant="tertiary"
                  isIconOnly
                  isDisabled={busy}
                  aria-label={t(($) => $.training.menu)}
                >
                  <EllipsisVertical className="size-4" aria-hidden="true" />
                </Button>
                <Dropdown.Popover placement="bottom end">
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
              if (busy) {
                formEvent.preventDefault();
                return;
              }
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
              } else if (lesson) {
                formEvent.preventDefault();
                if (!completed) action.mutate({ type: "result" });
              } else if (mode === "result") {
                void result.handleSubmit((values) =>
                  action.mutate({ type: "result", ...values }),
                )(formEvent);
              } else formEvent.preventDefault();
            }}
          >
            <Modal.Body className="flex flex-col gap-5">
              <TrainingMeta event={event} />
              {mode === "schedule" ? (
                <ScheduleFields
                  control={schedule.control}
                  index={0}
                  isDisabled={busy}
                  minDate={format(today, "yyyy-MM-dd")}
                />
              ) : (
                event.exercise && (
                  <>
                    {event.exercise.procedure?.trim() && (
                      <ExerciseProcedure text={event.exercise.procedure} />
                    )}
                    <Controller
                      control={result.control}
                      name="rating"
                      render={({ field, fieldState }) => (
                        <RadioGroup
                          isRequired
                          isDisabled={busy}
                          isInvalid={fieldState.invalid}
                          name={field.name}
                          value={String(field.value)}
                          onChange={(value) => field.onChange(Number(value))}
                          onBlur={field.onBlur}
                          orientation="horizontal"
                          // Label above the stars, as in Figma; the horizontal
                          // orientation still drives arrow-key navigation.
                          className="flex-col gap-2"
                        >
                          <Label>{t(($) => $.training.rating)}</Label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((value) => {
                              const Icon =
                                value <= field.value ? StarFill : Star;
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
                                    {/* Switching Star ↔ StarFill remounts the
                                      icon, so only stars that just changed
                                      animate: filled ones pop left to right,
                                      emptied ones deflate right to left. */}
                                    <Icon
                                      className={
                                        value <= field.value
                                          ? "size-6 animate-pop text-warning stagger-delay"
                                          : value <= fillFrom
                                            ? "size-6 animate-unpop text-muted stagger-delay"
                                            : "size-6 text-muted"
                                      }
                                      style={
                                        {
                                          "--i":
                                            value <= field.value
                                              ? Math.max(
                                                  0,
                                                  value - fillFrom - 1,
                                                )
                                              : fillFrom - value,
                                        } as CSSProperties
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
                    <ExerciseVideos
                      dogId={event.dogId}
                      key={event.id}
                      sessionId={event.id}
                      isDisabled={action.isPending}
                      onBusyChange={setVideosBusy}
                    />
                    <Controller
                      control={result.control}
                      name="note"
                      render={({ field, fieldState }) => (
                        <TextField
                          isDisabled={busy}
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
                )
              )}
              {action.isError && (
                <p role="alert" className="text-sm text-danger">
                  {mode === "schedule" && isDuplicateDayError(action.error)
                    ? t(($) => $.training.duplicateDay)
                    : t(($) => $.training.error)}
                </p>
              )}
            </Modal.Body>
            <Modal.Footer className="flex-wrap">
              {lesson && completed && mode === "result" ? (
                // Figma L9: a completed lesson has nothing left to save.
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-auto sm:flex-none"
                  onPress={onClose}
                >
                  {t(($) => $.training.close)}
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-auto sm:flex-none"
                    isDisabled={busy}
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
                    className="flex-auto sm:flex-none"
                    isPending={action.isPending}
                    isDisabled={
                      busy || (mode === "result" && !lesson && !rating)
                    }
                  >
                    {mode === "schedule"
                      ? t(($) => $.training.move)
                      : completed
                        ? t(($) => $.training.save)
                        : t(($) => $.training.complete)}
                  </Button>
                </>
              )}
            </Modal.Footer>
          </Form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

/**
 * The exercise's free-text procedure, kept as written (line breaks included).
 * A long one starts clamped to a few lines with a toggle to read it all; the
 * toggle only appears when the text actually overflows the clamp.
 */
function ExerciseProcedure({ text }: { text: string }) {
  const { t } = useTranslation();
  const headingId = useId();
  const textId = useId();
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const element = textRef.current;
    // Measured only while clamped; expanding keeps the toggle in place.
    if (!element || isExpanded) return;
    const measure = () =>
      setOverflows(element.scrollHeight > element.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isExpanded, text]);

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h3 id={headingId} className="text-sm font-medium">
        {t(($) => $.training.procedure)}
      </h3>
      <p
        ref={textRef}
        id={textId}
        className={cn(
          "text-sm leading-6 whitespace-pre-wrap",
          !isExpanded && "line-clamp-4",
        )}
      >
        {text.trim()}
      </p>
      {overflows && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          aria-expanded={isExpanded}
          aria-controls={textId}
          onPress={() => setIsExpanded((expanded) => !expanded)}
        >
          {isExpanded
            ? t(($) => $.training.showLess)
            : t(($) => $.training.showFullProcedure)}
          {isExpanded ? (
            <ChevronUp className="size-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-4" aria-hidden="true" />
          )}
        </Button>
      )}
    </section>
  );
}
