import type { ScheduledEvent } from "../api/eventsQueryOptions";
import { CircleCheck } from "@gravity-ui/icons";
import { Chip, Modal } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { transitionName } from "@/lib/utils";

import { RatingStars } from "./RatingStars";
import { TrainingMeta } from "./TrainingMeta";

/** History is intentionally read-only, unlike calendar training actions. */
export function TrainingHistoryDialog({
  event,
  onClose,
}: {
  event: ScheduledEvent;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Modal.Backdrop
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Container size="lg" scroll="outside" className="grow-from-trigger">
        <Modal.Dialog
          className="bg-background sm:max-w-160"
          style={transitionName("event", event.id)}
        >
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
            <TrainingMeta event={event} />
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
