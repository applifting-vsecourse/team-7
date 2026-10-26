import type { ComponentProps } from "react";
import { AnimatePresence, m } from "motion/react";

import { motionEase, motionSeconds } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** List whose removed items fade out while the rest slide into the gap. */
export function PresenceList({
  className,
  children,
  ...props
}: ComponentProps<"ul">) {
  return (
    // popLayout takes exiting items out of the flow, positioned against the list.
    <ul className={cn("relative", className)} {...props}>
      <AnimatePresence initial={false} mode="popLayout">
        {children}
      </AnimatePresence>
    </ul>
  );
}

/** Item of a PresenceList; items added later fade in. */
export function PresenceItem(props: ComponentProps<typeof m.li>) {
  return (
    <m.li
      layout="position"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 0.92,
        transition: {
          duration: motionSeconds("--motion-base"),
          ease: motionEase("--ease-exit"),
        },
      }}
      transition={{
        duration: motionSeconds("--motion-base"),
        ease: motionEase("--ease-enter"),
      }}
      {...props}
    />
  );
}
