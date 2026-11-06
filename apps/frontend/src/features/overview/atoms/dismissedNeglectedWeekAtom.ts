import { atomWithStorage } from "jotai/utils";

/**
 * Per user ID, the start of the week whose neglected-discipline warning the
 * handler closed; accounts sharing a browser keep their own choice.
 */
export const dismissedNeglectedWeekAtom = atomWithStorage<
  Record<string, string>
>("trainloop-neglected-dismissed-by-user", {}, undefined, { getOnInit: true });
