import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PresenceItem, PresenceList } from "./PresenceList";

const list = (ids: string[]) => (
  <PresenceList className="stagger">
    {ids.map((id) => (
      <PresenceItem key={id}>{id}</PresenceItem>
    ))}
  </PresenceList>
);

describe("PresenceItem", () => {
  it("leaves stagger to the first items and Motion to later ones", () => {
    const { rerender } = render(list(["first"]));

    rerender(list(["first", "later"]));

    expect(screen.getByText("first")).not.toHaveClass("animate-none!");
    expect(screen.getByText("later")).toHaveClass("animate-none!");
  });
});
