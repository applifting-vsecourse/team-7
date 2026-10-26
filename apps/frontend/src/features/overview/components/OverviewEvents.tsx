import { type PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export const OverviewEvents = ({
  isUpdating = false,
  children,
}: PropsWithChildren<{ isUpdating?: boolean }>) => {
  return (
    <div
      aria-busy={isUpdating}
      className={cn(
        "flex flex-col items-start gap-8 self-stretch transition-opacity duration-(--motion-base) md:flex-row md:flex-wrap md:content-start",
        // Dimmed while the previous dog selection is shown and the new one loads.
        isUpdating && "opacity-60",
      )}
    >
      {children}
    </div>
  );
};
