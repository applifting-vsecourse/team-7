import type { ScheduledEvent } from "../api/eventsQueryOptions";
import { CircleCheck } from "@gravity-ui/icons";
import { Chip, Modal } from "@heroui/react";
import { format, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";

import { DogAvatar } from "@/features/dogs/components/DogAvatar";

import { RatingStars } from "./RatingStars";

/** History is intentionally read-only, unlike calendar training actions. */
export function TrainingHistoryDialog({
  event,
  onClose,
}: {
  event: ScheduledEvent;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const date = parseISO(event.completedAt ?? event.startsAt);
  return (
    <Modal.Backdrop
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Container size="lg">
        <Modal.Dialog className="bg-background sm:max-w-160">
          <Modal.CloseTrigger aria-label={t(($) => $.dogProfile.close)} />
          <Modal.Header className="flex-col gap-2">
            <Modal.Heading className="text-2xl font-semibold tracking-tight">
              {event.exercise.name}
            </Modal.Heading>
            <Chip size="sm" color={event.completedAt ? "success" : "warning"}>
              {event.completedAt && (
                <CircleCheck aria-hidden="true" className="size-3" />
              )}
              <Chip.Label>
                {event.completedAt
                  ? t(($) => $.training.completed)
                  : t(($) => $.training.unfinished)}
              </Chip.Label>
            </Chip>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <p className="text-base font-medium">
                {t(($) => $.training.when, {
                  date: new Intl.DateTimeFormat(i18n.resolvedLanguage ?? "cs", {
                    weekday: "short",
                    day: "numeric",
                    month: "numeric",
                  }).format(date),
                  time: format(date, "HH:mm"),
                  duration: event.durationMinutes,
                })}
              </p>
              <p className="text-sm text-muted">
                {event.exercise.goal.discipline.name} ·{" "}
                {event.exercise.goal.name}
              </p>
            </div>
            <div className="flex w-fit min-w-48 items-center gap-3 rounded-3xl bg-default px-3 py-1.5">
              <DogAvatar dog={event.dog} />
              <span className="text-sm font-medium">{event.dog.name}</span>
            </div>
            {event.rating !== null && (
              <div className="flex flex-col gap-2">
                <p className="text-sm">{t(($) => $.training.rating)}</p>
                <RatingStars rating={event.rating} />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <p className="text-sm">{t(($) => $.training.note)}</p>
              <p className="text-sm leading-6 whitespace-pre-wrap">
                {event.note || t(($) => $.exerciseDetail.noNote)}
              </p>
            </div>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
