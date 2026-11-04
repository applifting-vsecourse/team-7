import { flushSync } from "react-dom";

import { transitionName } from "@/lib/utils";

const TRANSITION_LOAD_LIMIT_MS = 200;

// The last opened item, so it can morph back when its list returns.
let openedMorph: string | undefined;

/**
 * For a list item whose title morphs into the detail it opens. Only the opened
 * item carries the shared name: naming them all would capture every title on
 * each route change, and ones scrolled away would paint over the page chrome.
 */
export function openMorph(title: HTMLElement | null, ...parts: string[]) {
  openedMorph = transitionName(...parts).viewTransitionName;
  if (title) title.style.viewTransitionName = openedMorph;
}

/** The name for an item that was opened, so it morphs back from the detail. */
export function reopenedMorph(...parts: string[]) {
  const name = transitionName(...parts);
  return openedMorph === name.viewTransitionName ? name : undefined;
}

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

/** Motion transition for entrances and layout moves (--motion-base, --ease-enter). */
export function enterTransition() {
  return {
    duration: motionSeconds("--motion-base"),
    ease: motionEase("--ease-enter"),
  };
}

/**
 * For route loaders: a view transition captures the page once the loader is
 * done, so elements can morph only into loaded content. Waits for that briefly,
 * never failing: a slow or failed load must not hold up the navigation, the
 * page shows its own loading and error states instead.
 */
export function loadBeforeTransition(...loads: Promise<unknown>[]) {
  return Promise.race([
    Promise.allSettled(loads),
    new Promise((resolve) => setTimeout(resolve, TRANSITION_LOAD_LIMIT_MS)),
  ]);
}

/**
 * Runs a state update as a view transition: the DOM is updated synchronously
 * inside it, so the browser can morph elements that share a transition name.
 * Where unsupported, the update just runs.
 */
export function withViewTransition(update: () => void, types?: string[]) {
  if (!document.startViewTransition) {
    update();
    return Promise.resolve();
  }
  const run = () => flushSync(update);
  // Types (e.g. forward / back) pick a directional animation where supported.
  const withTypes =
    types && CSS.supports("selector(:active-view-transition-type(a))");
  return document.startViewTransition(withTypes ? { update: run, types } : run)
    .finished;
}
