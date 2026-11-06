import type { NeglectedDiscipline } from "../api/overviewQueryOptions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NeglectedDisciplines } from "./NeglectedDisciplines";

vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "owner" } }),
}));
vi.mock("@/lib/api-client", () => ({
  api: {
    get: (path: string) => ({
      json: async () =>
        path === "dogs"
          ? [{ id: "mája", name: "Mája" }]
          : ["Obedience", "Agility"].map((name) => ({
              id: `${name}-exercise`,
              name: `${name} exercise`,
              goalId: `${name}-goal`,
              goalName: `${name} goal`,
              goalStatus: "in_progress",
              status: "in_progress",
              disciplineId: name.toLowerCase(),
              disciplineName: name,
            })),
    }),
  },
}));

const item = (
  dog: string,
  discipline: string,
  lastTrainedAt: string | null = null,
): NeglectedDiscipline => ({
  dog: { id: dog.toLowerCase(), name: dog, avatarVersion: null },
  discipline: { id: discipline.toLowerCase(), name: discipline },
  lastTrainedAt,
});

function renderWarning(items: NeglectedDiscipline[], weekStart = "2026-11-02") {
  const store = createStore();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const ui = (week: string) => (
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <NeglectedDisciplines items={items} weekStart={week} />
      </QueryClientProvider>
    </Provider>
  );
  const view = render(ui(weekStart));
  return {
    user: userEvent.setup(),
    rerender: (week: string) => view.rerender(ui(week)),
  };
}

beforeEach(() => localStorage.clear());

describe("neglected disciplines warning", () => {
  it("lists the dog and discipline with the last training or never trained", () => {
    renderWarning([
      item("Mája", "Agility"),
      item("Rex", "Nosework", "2026-10-02T08:00:00Z"),
    ]);
    const warning = screen.getByRole("region", {
      name: "2 disciplines have no exercise this week",
    });
    const rows = within(warning).getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("Mája · Agility");
    expect(rows[0]).toHaveTextContent("not trained yet");
    expect(rows[1]).toHaveTextContent("Rex · Nosework");
    expect(rows[1]).toHaveTextContent("last 10/2");
  });

  it("uses the singular title for one discipline", () => {
    renderWarning([item("Mája", "Agility")]);
    expect(
      screen.getByText("1 discipline has no exercise this week"),
    ).toBeInTheDocument();
  });

  it("renders nothing without neglected disciplines", () => {
    renderWarning([]);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("shows three rows and expands the rest", async () => {
    const { user } = renderWarning(
      ["A", "B", "C", "D", "E"].map((dog) => item(dog, "Agility")),
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: "Show more (2)" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    await user.click(screen.getByRole("button", { name: "Show less" }));
    expect(
      screen.getByRole("button", { name: "Show more (2)" }),
    ).toBeInTheDocument();
  });

  it("hides the warning until the next week when dismissed", async () => {
    const { user, rerender } = renderWarning([item("Mája", "Agility")]);
    await user.click(
      screen.getByRole("button", { name: "Hide until next week" }),
    );
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(
      JSON.parse(
        localStorage.getItem("trainloop-neglected-dismissed-by-user")!,
      ),
    ).toEqual({ owner: "2026-11-02" });
    rerender("2026-11-09");
    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  it("ignores a dismissal by another account in the same browser", () => {
    localStorage.setItem(
      "trainloop-neglected-dismissed-by-user",
      JSON.stringify({ other: "2026-11-02" }),
    );
    renderWarning([item("Mája", "Agility")]);
    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  it("opens planning for the row's dog with its discipline first and expanded", async () => {
    const { user } = renderWarning([item("Mája", "Agility")]);
    await user.click(
      screen.getByRole("button", { name: "Schedule: Mája · Agility" }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("Step 2 of 3 · Exercises"),
    ).toBeInTheDocument();
    expect(await within(dialog).findByText("Mája")).toBeInTheDocument();
    const triggers = await within(dialog).findAllByRole("button", {
      name: /^(Agility|Obedience)/,
    });
    expect(triggers.map((trigger) => trigger.textContent)).toEqual([
      "Agility",
      "Obedience",
    ]);
    expect(triggers[0]).toHaveAttribute("aria-expanded", "true");
    expect(triggers[1]).toHaveAttribute("aria-expanded", "false");
  });
});
