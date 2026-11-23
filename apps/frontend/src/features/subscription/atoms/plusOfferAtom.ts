import { atom } from "jotai";
export type PlusReason = "dogs" | "goals" | "videos" | "stats" | "renew";
export type PlusOffer = {
  reason: PlusReason;
  onSuccess?: () => void;
  /** The user closed the offer without getting Plus. */
  onDismiss?: () => void;
};
export const plusOfferAtom = atom<PlusOffer | null>(null);
