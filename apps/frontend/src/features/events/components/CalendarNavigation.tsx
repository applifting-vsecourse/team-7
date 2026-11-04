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

/**
 * Previous / back-to-now / next controls shared by the calendar views.
 * Stretches across the row on phones, as in Figma.
 */
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
    <ButtonGroup
      variant="tertiary"
      size="sm"
      aria-label={label}
      className="w-full md:w-auto"
    >
      <Button
        isIconOnly
        aria-label={previousLabel}
        onPress={onPrevious}
        className="flex-1 md:flex-none"
      >
        <ChevronLeft className="size-4 text-accent" aria-hidden="true" />
      </Button>
      <Button
        onPress={onCurrent}
        aria-current={isCurrent ? "true" : undefined}
        className="flex-1 md:flex-none"
      >
        <ButtonGroup.Separator />
        {currentLabel}
      </Button>
      <Button
        isIconOnly
        aria-label={nextLabel}
        onPress={onNext}
        className="flex-1 md:flex-none"
      >
        <ButtonGroup.Separator />
        <ChevronRight className="size-4 text-accent" aria-hidden="true" />
      </Button>
    </ButtonGroup>
  );
}
