import { atom } from "jotai";

/**
 * The add-dog dialog lives outside the sidebar, which remounts when the layout
 * switches between desktop and the mobile drawer; keeping the open state here
 * stops a window resize from closing the dialog mid-form.
 */
export const addDogDialogOpenAtom = atom(false);
