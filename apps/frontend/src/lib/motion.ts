import { flushSync } from "react-dom";

// JS animations read the CSS motion tokens, so global.css stays the single
// source of timing and reduced motion (which zeroes the tokens) applies too.
const token = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** A duration token in seconds; 0 when reduced or undefined (e.g. tests). */
export function motionSeconds(name: string) {
  const value = token(name);
  return (parseFloat(value) || 0) / (value.endsWith("ms") ? 1000 : 1);
}

/** A cubic-bezier easing token as Motion's four-number form. */
export function motionEase(name: string) {
  return token(name)
    .match(/[\d.]+/g)
    ?.map(Number) as [number, number, number, number] | undefined;
}

/**
 * Runs a state update as a view transition: the DOM is updated synchronously
 * inside it, so the browser can morph elements that share a transition name.
 * Where unsupported, the update just runs.
 */
export function withViewTransition(update: () => void) {
  if (!document.startViewTransition) {
    update();
    return Promise.resolve();
  }
  return document.startViewTransition(() => flushSync(update)).finished;
}
