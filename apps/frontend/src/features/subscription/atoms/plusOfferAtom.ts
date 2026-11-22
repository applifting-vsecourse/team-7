import { atom } from "jotai";
export type PlusReason = "dogs" | "goals" | "videos" | "stats" | "renew";
export type PlusOffer = { reason: PlusReason; onSuccess?: () => void };
export const plusOfferAtom = atom<PlusOffer | null>(null);
