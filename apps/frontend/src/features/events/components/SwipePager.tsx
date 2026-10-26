import { type ReactNode, useRef } from "react";
import { useMediaQuery } from "@heroui/react";
import { m } from "motion/react";

// Distance (px, with velocity projected 0.2 s ahead) that pages the period.
const SWIPE_THRESHOLD = 80;

/** Where a released swipe pages: 1 next, -1 previous, 0 back to rest. */
export function swipeDirection(offsetX: number, velocityX: number) {
  const swipe = offsetX + velocityX * 0.2;
  return swipe < -SWIPE_THRESHOLD ? 1 : swipe > SWIPE_THRESHOLD ? -1 : 0;
}

/**
 * Touch users swipe a calendar period: the content follows the finger
 * (rubber-banded) and a far or fast swipe pages to the previous / next period,
 * which then slides in through the date change's view transition.
 */
export function SwipePager({
  onPrevious,
  onNext,
  className,
  children,
}: {
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
  children: ReactNode;
}) {
  const isTouch = useMediaQuery("(pointer: coarse)");
  const ref = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);

  return (
    <m.div
      ref={ref}
      drag={isTouch ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.25}
      dragSnapToOrigin
      onPointerDownCapture={() => {
        dragged.current = false;
      }}
      onDragStart={(event) => {
        dragged.current = true;
        // A touch is implicitly captured by the tile under the finger, so its
        // button would take the release as a tap. Taking the capture here
        // makes React Aria see the release elsewhere and cancel the press.
        if ("pointerId" in event) {
          ref.current?.setPointerCapture(event.pointerId);
        }
      }}
      onDragEnd={(_, { offset, velocity }) => {
        const direction = swipeDirection(offset.x, velocity.x);
        if (direction === 1) onNext();
        else if (direction === -1) onPrevious();
      }}
      onClickCapture={(event) => {
        if (!dragged.current) return;
        event.stopPropagation();
        event.preventDefault();
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}
