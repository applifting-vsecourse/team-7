import {
  Children,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, m, PresenceContext } from "motion/react";

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

/**
 * Wrap a PresenceList in a visible or scrolling container with this. Exiting
 * items leave the flow at once, so the container would shrink under them and
 * they would overflow it; this keeps its height until they are gone.
 */
export function PresenceHeight({
  className,
  children,
}: ComponentPropsWithoutRef<"div">) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState<number>();

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const observer = new ResizeObserver(() =>
      setMinHeight(content.offsetHeight),
    );
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="hold-height" style={{ minHeight }}>
      <div ref={contentRef} className={className}>
        {children}
      </div>
    </div>
  );
}

/** Section that slides to its new place when content above it changes height. */
export function PresenceSection(props: ComponentProps<typeof m.section>) {
  return (
    <m.section layout="position" transition={enterTransition()} {...props} />
  );
}

/** Item of a PresenceList; items added later fade in. */
export function PresenceItem({
  className,
  ...props
}: ComponentProps<typeof m.li>) {
  // The list's first items enter by `stagger`; on later ones its CSS animation
  // would delay and override Motion's fade.
  const isFirstRender = useContext(PresenceContext)?.initial === false;
  return (
    <m.li
      layout="position"
      className={cn(!isFirstRender && "animate-none!", className)}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 0.92,
        transition: {
          duration: motionSeconds("--motion-fast"),
          ease: motionEase("--ease-exit"),
        },
      }}
      transition={enterTransition()}
      {...props}
    />
  );
}
