import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  type CalendarView,
  CalendarViewSwitcher,
} from "./CalendarViewSwitcher";

// Like the calendar route: each view mounts its own switcher.
function Views() {
  const [view, setView] = useState<CalendarView>("week");
  return <CalendarViewSwitcher key={view} value={view} onChange={setView} />;
}

describe("CalendarViewSwitcher", () => {
  it("keeps focus on the selected view after the switcher remounts", async () => {
    const user = userEvent.setup();
    render(<Views />);
    expect(document.body).toHaveFocus();

    await user.click(screen.getByRole("radio", { name: "Month" }));

    expect(screen.getByRole("radio", { name: "Month" })).toHaveFocus();
  });

  it("doesn't take focus when the page opens", () => {
    render(<Views />);

    expect(document.body).toHaveFocus();
  });
});
