import { useEffect, useState } from "react";

export type Box = { x: number; y: number; width: number; height: number };

type Tracked = {
  selector: string | null;
  box: Box | null;
  // Where the bubble is anchored: changes only once the target has settled
  // somewhere else, so a press, hover lift or slide-in doesn't re-create it.
  anchor: Box | null;
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

// Presses (scale) and hover lifts move a target by a pixel or two.
const moved = (a: Box | null, b: Box) =>
  !a ||
  Math.abs(a.x - b.x) > 4 ||
  Math.abs(a.y - b.y) > 4 ||
  Math.abs(a.width - b.width) > 4 ||
  Math.abs(a.height - b.height) > 4;
const SETTLE_MS = 150;

/**
 * Follows the highlighted element on screen (it moves with layout, the
 * drawer animation or a resize). `missing` turns on when it hasn't shown up
 * for a while, so the tour can fall back to a centred bubble.
 */
export function useTargetBox(selector: string | null, enabled: boolean) {
  const [tracked, setTracked] = useState<Tracked>({
    selector: null,
    box: null,
    anchor: null,
    missing: false,
    modalOpen: false,
    viewport: { width: 0, height: 0 },
  });

  useEffect(() => {
    // Polls only while the tour is on screen.
    if (!enabled) return;
    let frame = 0;
    let scrolled = false;
    let anchor: Box | null = null;
    let candidate: Box | null = null;
    let since = 0;
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
      // Layout size, centred where the element is drawn: a press scales a
      // button around its centre, which must not move the spotlight.
      const width = element?.offsetWidth || rect?.width || 0;
      const height = element?.offsetHeight || rect?.height || 0;
      const box = found
        ? {
            x: Math.round(rect.x + (rect.width - width) / 2),
            y: Math.round(rect.y + (rect.height - height) / 2),
            width: Math.round(width),
            height: Math.round(height),
          }
        : null;
      const now = performance.now();
      if (!same(box, candidate)) {
        candidate = box;
        since = now;
      } else if (box && now - since >= SETTLE_MS && moved(anchor, box)) {
        anchor = box;
      }
      if (!box) anchor = null;
      const missing = !found && now - start > 600;
      // A closing dialog no longer counts, so the tour returns as it fades out.
      const modalOpen = !!document.querySelector(
        '.modal__backdrop:not([data-exiting="true"])',
      );
      const viewport = { width: innerWidth, height: innerHeight };
      setTracked((prev) =>
        prev.selector === selector &&
        same(prev.box, box) &&
        same(prev.anchor, anchor) &&
        prev.missing === missing &&
        prev.modalOpen === modalOpen &&
        prev.viewport.width === viewport.width &&
        prev.viewport.height === viewport.height
          ? prev
          : { selector, box, anchor, missing, modalOpen, viewport },
      );
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [selector, enabled]);

  const current = tracked.selector === selector;
  return {
    box: current ? tracked.box : null,
    anchor: current ? tracked.anchor : null,
    missing: current && tracked.missing,
    modalOpen: tracked.modalOpen,
    viewport: tracked.viewport,
  };
}
