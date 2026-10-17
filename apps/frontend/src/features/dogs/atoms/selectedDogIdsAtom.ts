import { atom } from "jotai";

/** Dog IDs included in the overview filter. An empty array selects no dogs. */
export const selectedDogIdsAtom = atom<string[]>([]);
