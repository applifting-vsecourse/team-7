import { ChevronLeft, ChevronRight } from "@gravity-ui/icons";
import { Button, ButtonGroup } from "@heroui/react";

type CalendarNavigationProps = {
  label: string;
  previousLabel: string;
  nextLabel: string;
  currentLabel: string;
  isCurrent: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onCurrent: () => void;
};

/** Previous / next / back-to-now controls shared by the day and month views. */
export function CalendarNavigation({
  label,
  previousLabel,
  nextLabel,
  currentLabel,
  isCurrent,
  onPrevious,
  onNext,
  onCurrent,
}: CalendarNavigationProps) {
  return (
    <ButtonGroup variant="secondary" size="sm" aria-label={label}>
      <Button isIconOnly aria-label={previousLabel} onPress={onPrevious}>
        <ChevronLeft className="size-4 text-accent" aria-hidden="true" />
      </Button>
      <Button isIconOnly aria-label={nextLabel} onPress={onNext}>
        <ButtonGroup.Separator />
        <ChevronRight className="size-4 text-accent" aria-hidden="true" />
      </Button>
      <Button
        onPress={onCurrent}
        aria-current={isCurrent ? "true" : undefined}
        className={
          isCurrent ? "bg-accent-soft text-accent-soft-foreground" : undefined
        }
      >
        <ButtonGroup.Separator />
        {currentLabel}
      </Button>
    </ButtonGroup>
  );
}
