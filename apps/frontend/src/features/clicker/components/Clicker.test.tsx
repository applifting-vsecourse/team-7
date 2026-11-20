import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clickerAtom,
  measure,
  type ClickerSession,
} from "../atoms/clickerAtom";
import { Clicker } from "./Clicker";

vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "user-a" } }),
}));
vi.mock("../lib/feedback", () => ({ clickerFeedback: vi.fn() }));
vi.mock("@/features/events/components/ScheduledExerciseDialog", () => ({
  ScheduledExerciseDialog: ({
    onClose,
    onSaved,
  }: {
    onClose: () => void;
    onSaved: () => void;
  }) => (
    <div>
      <button onClick={onClose}>Cancel result</button>
      <button onClick={onSaved}>Save result</button>
    </div>
  ),
}));

const session = (): ClickerSession => ({
  userId: "user-a",
  startedAt: Date.now(),
  attempts: [],
  view: "full",
  event: {
    id: "event-a",
    kind: "exercise",
    dogId: "dog-a",
    startsAt: new Date().toISOString(),
    durationMinutes: 15,
    rating: null,
    note: null,
    completedAt: null,
    paused: false,
    dog: { id: "dog-a", name: "Mája", avatarVersion: null },
    exercise: {
      id: "exercise-a",
      name: "Recall",
      procedure: null,
      goal: {
        id: "goal-a",
        name: "Recall",
        discipline: { id: "discipline-a", name: "Obedience" },
      },
    },
  },
});

function setup(initial = session()) {
  const store = createStore();
  store.set(clickerAtom, initial);
  render(
    <Provider store={store}>
      <Clicker />
    </Provider>,
  );
  return store;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("clicker session", () => {
  it("counts success and failure separately and undoes the last attempt", async () => {
    const user = userEvent.setup();
    const store = setup();
    expect(screen.getByRole("button", { name: "Undo last" })).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "CLICKSuccessful attempt" }),
    );
    await user.click(
      screen.getByRole("button", { name: "+1 attemptUnsuccessful attempt" }),
    );
    expect(measure(store.get(clickerAtom)!)).toMatchObject({
      successfulAttempts: 1,
      totalAttempts: 2,
    });
    expect(screen.getByText("50%")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo last" }));
    expect(measure(store.get(clickerAtom)!)).toMatchObject({
      successfulAttempts: 1,
      totalAttempts: 1,
    });
  });

  it("keeps elapsed time while minimized and freezes the result until cancelled", async () => {
    const user = userEvent.setup();
    const store = setup({
      ...session(),
      startedAt: Date.now() - 125000,
      attempts: [true, false, true],
    });
    await user.click(screen.getByRole("button", { name: "Minimize exercise" }));
    expect(screen.getByText("Mája · 2 of 3 successful")).toBeInTheDocument();
    expect(
      measure(store.get(clickerAtom)!).elapsedSeconds,
    ).toBeGreaterThanOrEqual(125);
    await user.click(
      screen.getByRole("button", { name: "Return to exercise" }),
    );
    await user.click(screen.getByRole("button", { name: "Finish exercise" }));
    const frozen = measure(
      store.get(clickerAtom)!,
      Date.now() + 10000,
    ).elapsedSeconds;
    expect(frozen).toBe(store.get(clickerAtom)!.elapsedSeconds);
    await user.click(screen.getByRole("button", { name: "Cancel result" }));
    expect(store.get(clickerAtom)?.view).toBe("full");
    expect(store.get(clickerAtom)?.attempts).toEqual([true, false, true]);
    expect(measure(store.get(clickerAtom)!).elapsedSeconds).toBe(frozen);
  });

  it("handles Space once and leaves button keyboard actions to HeroUI", () => {
    const store = setup();
    fireEvent.keyDown(document.body, { code: "Space" });
    fireEvent.keyDown(document.body, { code: "Space", repeat: true });
    fireEvent.keyDown(screen.getByRole("button", { name: "Undo last" }), {
      code: "Space",
    });
    expect(store.get(clickerAtom)?.attempts).toEqual([true]);
  });

  it("only discards attempts after confirmation", async () => {
    const user = userEvent.setup();
    const store = setup({ ...session(), attempts: [true] });
    await user.click(screen.getByRole("button", { name: "Training actions" }));
    await user.click(
      screen.getByRole("menuitem", { name: "Finish without saving" }),
    );
    expect(store.get(clickerAtom)).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Finish without saving" }),
    );
    expect(store.get(clickerAtom)).toBeNull();
  });

  it("clears the session after saving and never exposes another handler's session", () => {
    const store = setup({ ...session(), userId: "other-user" });
    expect(store.get(clickerAtom)).toBeNull();
    act(() =>
      store.set(clickerAtom, {
        ...session(),
        view: "review",
        elapsedSeconds: 42,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save result" }));
    expect(store.get(clickerAtom)).toBeNull();
  });
});
