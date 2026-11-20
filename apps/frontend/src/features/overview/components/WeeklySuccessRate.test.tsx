import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { overviewSchema } from "../api/overviewQueryOptions";
import { WeeklySuccessRate } from "./WeeklySuccessRate";

const stats = overviewSchema.shape.stats.parse({
  weekStart: "2026-10-26",
  weekEnd: "2026-11-01",
  completedExercises: 0,
  plannedExercises: 0,
  streakDays: 0,
  trainingMinutes: 0,
  satisfaction: null,
  satisfactionHistory: [],
});

describe("weekly success rate", () => {
  it("keeps six calendar weeks and shows unavailable data without inventing zero success", () => {
    render(<WeeklySuccessRate data={stats} />);
    expect(
      screen.getByText("Success rates from previous weeks will appear here."),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(screen.getAllByText("–")).toHaveLength(6);
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
  });

  it("keeps previous measurements without showing a trend when this week is empty", () => {
    render(
      <WeeklySuccessRate
        data={{
          ...stats,
          successHistory: [
            { weekStart: "2026-10-19", successRate: 0.72 },
            { weekStart: "2026-10-05", successRate: 0.71 },
          ],
        }}
      />,
    );
    expect(screen.queryByText("+1%")).not.toBeInTheDocument();
    const weeks = screen.getAllByRole("listitem");
    expect(within(weeks[2]!).getByText("71%")).toBeInTheDocument();
    expect(within(weeks[4]!).getByText("72%")).toBeInTheDocument();
    expect(within(weeks[5]!).getByText("–")).toBeInTheDocument();
  });

  it("does not compare this week with measurements before an empty previous week", () => {
    render(
      <WeeklySuccessRate
        data={{
          ...stats,
          successRate: 0.72,
          successHistory: [{ weekStart: "2026-10-12", successRate: 0.71 }],
        }}
      />,
    );
    expect(screen.queryByText("+1%")).not.toBeInTheDocument();
  });

  it("treats zero success as a measurement and shows decreases", () => {
    render(
      <WeeklySuccessRate
        data={{
          ...stats,
          successRate: 0,
          successHistory: [{ weekStart: "2026-10-19", successRate: 0.5 }],
        }}
      />,
    );
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("-50%")).toBeInTheDocument();
    expect(
      within(screen.getAllByRole("listitem")[5]!).queryByText("–"),
    ).not.toBeInTheDocument();
  });
});
