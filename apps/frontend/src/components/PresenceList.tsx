import {
  Children,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { AnimatePresence, m } from "motion/react";

import { enterTransition, motionEase, motionSeconds } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * List whose removed items fade out while the rest slide into the gap. Give
 * it a `key` per period (day, month) when its content is replaced wholesale,
 * so paging remounts it instead of animating every item out and in.
 *
 * `empty` (give it `animate-enter`) shows when there are no items. The list
 * stays mounted while empty, so the first item still animates in and the
 * last one out, instead of the list swapping with the empty text.
 */
export function PresenceList({
  as: List = "ul",
  className,
  children,
  empty,
  ...props
}: ComponentPropsWithoutRef<"ul"> & { as?: "ul" | "ol"; empty?: ReactNode }) {
  return (
    <>
      {/* popLayout takes exiting items out of the flow, positioned against
          the list; :empty hides it (and its gap) once nothing is left. */}
      <List className={cn("relative empty:hidden", className)} {...props}>
        <AnimatePresence initial={false} mode="popLayout">
          {children}
        </AnimatePresence>
      </List>
      {Children.count(children) === 0 && empty}
    </>
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
      transition={enterTransition()}
      {...props}
    />
  );
}
