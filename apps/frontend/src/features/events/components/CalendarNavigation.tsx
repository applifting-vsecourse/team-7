import { ChevronLeft, ChevronRight } from "@gravity-ui/icons";
import { Button, ButtonGroup } from "@heroui/react";

type CalendarNavigationProps = {
  label: string;
  previousLabel: string;
  nextLabel: string;
  currentLabel: string;
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
      <Button onPress={onCurrent}>
        <ButtonGroup.Separator />
        {currentLabel}
      </Button>
    </ButtonGroup>
  );
}
