import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Upper-cases the first character, leaving the rest as typed. */
export function capitalizeFirst(value: string) {
  return value.charAt(0).toLocaleUpperCase() + value.slice(1);
}
