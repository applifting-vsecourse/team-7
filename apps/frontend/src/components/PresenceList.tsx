import type { ComponentProps, ComponentPropsWithoutRef } from "react";
import { AnimatePresence, m } from "motion/react";

import { motionEase, motionSeconds } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * List whose removed items fade out while the rest slide into the gap. Give
 * it a `key` per period (day, month) when its content is replaced wholesale,
 * so paging remounts it instead of animating every item out and in.
 */
export function PresenceList({
  as: List = "ul",
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"ul"> & { as?: "ul" | "ol" }) {
  return (
    // popLayout takes exiting items out of the flow, positioned against the list.
    <List className={cn("relative", className)} {...props}>
      <AnimatePresence initial={false} mode="popLayout">
        {children}
      </AnimatePresence>
    </List>
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
