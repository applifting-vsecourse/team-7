import { useEffect, useState } from "react";

export type Box = { x: number; y: number; width: number; height: number };

type Tracked = {
  selector: string | null;
  box: Box | null;
  missing: boolean;
  // A dialog is open (e.g. the one the action step started): the tour waits.
  modalOpen: boolean;
  viewport: { width: number; height: number };
};

const same = (a: Box | null, b: Box | null) =>
  a === b ||
  (!!a &&
    !!b &&
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height);

/**
 * Follows the highlighted element on screen (it moves with layout, the
 * drawer animation or a resize). `missing` turns on when it hasn't shown up
 * for a while, so the tour can fall back to a centred bubble.
 */
export function useTargetBox(selector: string | null, enabled: boolean) {
  const [tracked, setTracked] = useState<Tracked>({
    selector: null,
    box: null,
    missing: false,
    modalOpen: false,
    viewport: { width: 0, height: 0 },
  });

  useEffect(() => {
    // Polls only while the tour is on screen.
    if (!enabled) return;
    let frame = 0;
    let scrolled = false;
    const start = performance.now();
    const tick = () => {
      const element = selector
        ? document.querySelector<HTMLElement>(selector)
        : null;
      const rect = element?.getBoundingClientRect();
      const found = !!rect && rect.width > 0 && rect.height > 0;
      if (found && !scrolled) {
        element!.scrollIntoView({ block: "nearest" });
        scrolled = true;
      }
      const box = found
        ? {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          }
        : null;
      const missing = !found && performance.now() - start > 600;
      const modalOpen = !!document.querySelector(".modal__backdrop");
      const viewport = { width: innerWidth, height: innerHeight };
      setTracked((prev) =>
        prev.selector === selector &&
        same(prev.box, box) &&
        prev.missing === missing &&
        prev.modalOpen === modalOpen &&
        prev.viewport.width === viewport.width &&
        prev.viewport.height === viewport.height
          ? prev
          : { selector, box, missing, modalOpen, viewport },
      );
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [selector, enabled]);

  const current = tracked.selector === selector;
  return {
    box: current ? tracked.box : null,
    missing: current && tracked.missing,
    modalOpen: tracked.modalOpen,
    viewport: tracked.viewport,
  };
}
