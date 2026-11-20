import { atom } from "jotai";

import type { ScheduledEvent } from "@/features/events/api/eventsQueryOptions";

export type Measurement = {
  successfulAttempts: number;
  totalAttempts: number;
  elapsedSeconds: number;
};

export type ClickerSession = {
  event: ScheduledEvent;
  userId: string;
  startedAt: number;
  attempts: boolean[];
  view: "full" | "minimized" | "review";
  elapsedSeconds?: number;
  resultDraft?: { rating: number; note: string };
};

export const clickerAtom = atom<ClickerSession | null>(null);

export function measure(
  session: ClickerSession,
  now = Date.now(),
): Measurement {
  return {
    successfulAttempts: session.attempts.filter(Boolean).length,
    totalAttempts: session.attempts.length,
    elapsedSeconds:
      session.elapsedSeconds ??
      Math.min(
        86400,
        Math.max(0, Math.floor((now - session.startedAt) / 1000)),
      ),
  };
}

export function formatTimer(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
