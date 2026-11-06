import type { ScheduledEvent } from "../api/eventsQueryOptions";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Event } from "./Event";

const scheduledEvent: ScheduledEvent = {
  id: "event-a",
  dogId: "dog-a",
  startsAt: "2099-01-02T08:00:00Z",
  durationMinutes: 10,
  rating: null,
  note: null,
  completedAt: null,
  paused: false,
  dog: { id: "dog-a", name: "Mája", avatarVersion: null },
  exercise: {
    id: "e1",
    name: "Recall",
    procedure: null,
    goal: {
      id: "g1",
      name: "Reliable recall",
      discipline: { id: "d1", name: "Obedience" },
    },
  },
};
const props = {
  scheduledEvent,
  dogName: "Mája",
  discipline: "Obedience",
  exercise: "Recall",
  time: "08:00",
  durationMinutes: 10,
};
const tile = () => screen.getByRole("article", { name: "Recall" });

afterEach(cleanup);

describe("dragging a training in the calendar", () => {
  it("lets an upcoming or unfinished training be dragged", () => {
    const { rerender } = render(<Event {...props} isDraggable />);
    expect(tile()).toHaveAttribute("draggable", "true");
    rerender(<Event {...props} state="unfinished" isDraggable />);
    expect(tile()).toHaveAttribute("draggable", "true");
  });

  it("keeps completed trainings and other views in place", () => {
    const { rerender } = render(
      <Event {...props} state="completed" isDraggable />,
    );
    expect(tile()).toHaveAttribute("draggable", "false");
    rerender(<Event {...props} />);
    expect(tile()).toHaveAttribute("draggable", "false");
  });
});

describe("paused training", () => {
  const paused = { ...scheduledEvent, paused: true };

  it("adds a grey Paused line to an upcoming training", () => {
    const { rerender } = render(<Event {...props} />);
    expect(tile()).not.toHaveTextContent("Paused");
    rerender(<Event {...props} scheduledEvent={paused} />);
    expect(tile()).toHaveTextContent("Paused");
  });

  it.each(["completed", "unfinished"] as const)(
    "keeps a %s training in the history without the Paused line",
    (state) => {
      render(<Event {...props} scheduledEvent={paused} state={state} />);
      expect(tile()).not.toHaveTextContent("Paused");
    },
  );
});
