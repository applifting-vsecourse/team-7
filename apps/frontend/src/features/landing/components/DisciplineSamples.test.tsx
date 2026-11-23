import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api-client";

import { DisciplineSamples } from "./DisciplineSamples";

vi.mock("@/lib/api-client", () => ({ api: { get: vi.fn() } }));

const discipline = (key: string, name: string, goals: string[][]) => ({
  key,
  shortName: key,
  name,
  description: "",
  goals: goals.map(([goal, ...exercises]) => ({
    name: goal,
    exercises: exercises.map((exercise) => ({ name: exercise })),
  })),
});

const catalog = {
  categories: [
    {
      key: "everyday",
      name: "Everyday",
      description: "Life with a dog.",
      disciplines: [
        discipline("obedience", "Basic obedience", [
          ["Loose lead", "Name focus", "Turns"],
          ["Sit and stay", "Sit"],
        ]),
        discipline("recall", "Reliable recall", [
          ["Recall at home", "From 5 m"],
        ]),
      ],
    },
    {
      key: "scent",
      name: "Scent work",
      description: "Noses at work.",
      disciplines: [
        discipline("nosework", "Nosework", [["Find the box", "One box"]]),
      ],
    },
  ],
};

const respond = (result: () => Promise<unknown>) =>
  vi.mocked(api.get).mockReturnValue({ json: result } as never);

const renderSamples = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <DisciplineSamples />
    </QueryClientProvider>,
  );

describe("DisciplineSamples", () => {
  beforeEach(() => vi.mocked(api.get).mockReset());

  it("previews the first discipline and counts the catalog", async () => {
    respond(async () => catalog);
    renderSamples();

    expect(
      await screen.findByRole("heading", { name: "Basic obedience" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 goals · 3 exercises")).toBeInTheDocument();
    expect(
      screen.getByText(/pick from 3 disciplines in 2 areas/),
    ).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith(
      "catalog",
      expect.objectContaining({ searchParams: { lng: "en" } }),
    );
  });

  it("switches the preview with the discipline and resets it with the category", async () => {
    const user = userEvent.setup();
    respond(async () => catalog);
    renderSamples();

    await user.click(await screen.findByRole("row", { name: "recall" }));
    expect(
      screen.getByRole("heading", { name: "Reliable recall" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Basic obedience" }),
    ).toBeNull();

    await user.click(screen.getByRole("tab", { name: "Scent work" }));
    expect(
      screen.getByRole("heading", { name: "Nosework" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Everyday" }));
    const tags = screen.getByRole("grid", { name: "Disciplines in Everyday" });
    expect(
      within(tags).getByRole("row", { name: "obedience" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("heading", { name: "Basic obedience" }),
    ).toBeInTheDocument();
  });

  it("retries after a failed load", async () => {
    const user = userEvent.setup();
    respond(async () => {
      throw new Error("down");
    });
    renderSamples();

    expect(
      await screen.findByText("The discipline samples couldn't be loaded."),
    ).toBeInTheDocument();
    respond(async () => catalog);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("heading", { name: "Basic obedience" }),
    ).toBeInTheDocument();
  });

  it("says so when the catalog is empty", async () => {
    respond(async () => ({ categories: [] }));
    renderSamples();

    expect(
      await screen.findByText("There are no discipline samples yet."),
    ).toBeInTheDocument();
  });
});
