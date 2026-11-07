import { atom } from "jotai";

/** "Add to home screen" from the user menu (O13) shows the install step alone. */
export const installGuideOpenAtom = atom(false);
