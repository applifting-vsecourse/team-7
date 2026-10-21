import { atom } from "jotai";

/**
 * Dog IDs included in the overview filter. `null` (the default) selects all
 * dogs, including ones added later; an empty array selects no dogs.
 */
export const selectedDogIdsAtom = atom<string[] | null>(null);
