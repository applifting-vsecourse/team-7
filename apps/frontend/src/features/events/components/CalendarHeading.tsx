import type { ReactNode } from "react";

type CalendarHeadingProps = {
  title: ReactNode;
  /** Muted range or date summary next to the controls. */
  summary?: ReactNode;
  viewSwitcher?: ReactNode;
  navigation: ReactNode;
};

/**
 * Heading row shared by the day, week and month views: the title on the left,
 * then the summary, navigation and view switcher. The switcher sits at the end
 * on wider screens, so it stays put while the other controls change width
 * between views. On phones everything stacks and the navigation stretches
 * across the row, as in Figma.
 */
export function CalendarHeading({
  title,
  summary,
  viewSwitcher,
  navigation,
}: CalendarHeadingProps) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
      {title}
      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
        {summary}
        <div className="md:order-last">{viewSwitcher}</div>
        {navigation}
      </div>
    </div>
  );
}
