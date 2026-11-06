import { atomWithStorage } from "jotai/utils";

/** Start of the week whose neglected-discipline warning the handler closed. */
export const dismissedNeglectedWeekAtom = atomWithStorage<string | null>(
  "trainloop-neglected-dismissed",
  null,
  undefined,
  { getOnInit: true },
);
