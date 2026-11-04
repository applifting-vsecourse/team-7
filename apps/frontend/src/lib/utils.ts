import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Pairs elements across a view transition: the same name on a list item and
 * on the detail it opens morphs one into the other. Unique per page.
 */
export function transitionName(...parts: string[]) {
  return { viewTransitionName: parts.join("-") };
}

/** Upper-cases the first character, leaving the rest as typed. */
export function capitalizeFirst(value: string) {
  return value.charAt(0).toLocaleUpperCase() + value.slice(1);
}
