import { Button } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Subscription } from "@/features/settings/api/subscriptionQueryOptions";
import { subscriptionQueryOptions } from "@/features/settings/api/subscriptionQueryOptions";
import { usePlusOffer } from "@/features/subscription/hooks/useSubscription";
import { ExerciseVideos } from "@/features/videos/components/ExerciseVideos";

import { SubscriptionDialogs } from "./SubscriptionDialogs";

const state = vi.hoisted(() => ({
  data: {} as Subscription,
  calls: vi.fn(),
  continue: vi.fn(),
}));
vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "owner" } }),
}));
vi.mock("@/lib/api-client", () => ({
  api: {
    get: (path: string) => ({
      json: async () => {
        state.calls(path);
        if (path === "users/me/subscription") return state.data;
        if (path === "users/me/subscription/dog-choices") {
          return [
            {
              id: "a",
              name: "Alpha",
              breed: null,
              avatarVersion: null,
              unfinishedGoals: 2,
            },
            {
              id: "b",
              name: "Beta",
              breed: null,
              avatarVersion: null,
              unfinishedGoals: 1,
            },
          ];
        }
        throw new Error(`Unexpected request: ${path}`);
      },
    }),
    post: (
      path: string,
      {
        json,
      }: {
        json: {
          action?: string;
          dogId?: string;
          billingPeriod?: "monthly" | "yearly";
        };
      },
    ) => ({
      json: async () => {
        state.calls(path, json);
        state.data = path.endsWith("active-dog")
          ? { ...state.data, needsDogChoice: false, activeDogId: json.dogId! }
          : {
              ...state.data,
              status: "trial",
              isPlus: true,
              trialUsed: true,
              billingPeriod: json.billingPeriod ?? "yearly",
              trialEndsAt: "2026-12-01T00:00:00Z",
              needsDogChoice: false,
            };
        return state.data;
      },
    }),
  },
}));
function Trigger() {
  const offer = usePlusOffer();
  return (
    <Button
      onPress={() => offer({ reason: "dogs", onSuccess: state.continue })}
    >
      Add dog
    </Button>
  );
}
function setup({
  videos = false,
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
} = {}) {
  return {
    ...render(
      <Provider>
        <QueryClientProvider client={client}>
          <Trigger />
          {videos && (
            <ExerciseVideos dogId="a" sessionId="s" onBusyChange={() => {}} />
          )}
          <SubscriptionDialogs />
        </QueryClientProvider>
      </Provider>,
    ),
    client,
    user: userEvent.setup(),
  };
}

describe("subscription UI boundaries", () => {
  beforeEach(() => {
    state.data = {
      status: "free",
      isPlus: false,
      needsDogChoice: false,
      activeDogId: "a",
      dogs: 1,
      goals: 2,
      billingPeriod: "yearly",
      trialUsed: false,
      paidUntil: null,
      trialEndsAt: null,
      retryAt: null,
      cardLast4: "4242",
      freeDogLimit: 1,
    };
    state.calls.mockClear();
    state.continue.mockClear();
  });
  it("offers a card-free trial with the selected plan and continues the original action", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Add dog" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Unlimited dogs with Plus")).toBeVisible();
    await user.click(
      within(dialog).getByRole("radio", { name: "Monthly · CZK 69" }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Try 14 days free" }),
    );
    await waitFor(() => expect(state.continue).toHaveBeenCalledOnce());
    expect(state.calls).toHaveBeenCalledWith("users/me/subscription", {
      action: "trial",
      billingPeriod: "monthly",
    });
  });
  it("shows the video section locked without requesting video metadata", async () => {
    const { user } = setup({ videos: true });
    expect(await screen.findByText("Exercise videos with Plus")).toBeVisible();
    expect(
      state.calls.mock.calls.every(
        ([path]) => !String(path).includes("/videos"),
      ),
    ).toBe(true);
    await user.click(screen.getByRole("button", { name: "Try Plus" }));
    expect(
      within(await screen.findByRole("dialog")).getByText(
        "Exercise videos with Plus",
      ),
    ).toBeVisible();
  });
  it("requires a choice again after remount and persists the selected dog", async () => {
    state.data = {
      ...state.data,
      needsDogChoice: true,
      activeDogId: null,
      dogs: 2,
      trialUsed: true,
    };
    const first = setup();
    let dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).queryByRole("button", { name: "Close" }),
    ).not.toBeInTheDocument();
    await first.user.keyboard("{Escape}");
    expect(dialog).toBeVisible();
    first.unmount();
    const second = setup();
    dialog = await screen.findByRole("dialog");
    await second.user.click(
      within(dialog).getByRole("button", { name: "Confirm selection" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Choose one dog.",
    );
    await second.user.click(
      within(dialog).getByRole("radio", { name: "Beta" }),
    );
    await second.user.click(
      within(dialog).getByRole("button", { name: "Confirm selection" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(state.calls).toHaveBeenCalledWith(
      "users/me/subscription/active-dog",
      { dogId: "b" },
    );
  });
  it("clears cached dog details on downgrade before refetching restricted data", async () => {
    state.data = { ...state.data, isPlus: true, status: "active" };
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(["dogProfiles", "owner", "b"], { private: "data" });
    setup({ client });
    await waitFor(() =>
      expect(
        client.getQueryData(subscriptionQueryOptions("owner").queryKey),
      ).toMatchObject({ isPlus: true }),
    );
    state.data = { ...state.data, isPlus: false, status: "free" };
    await client.invalidateQueries({
      queryKey: subscriptionQueryOptions("owner").queryKey,
    });
    await waitFor(() =>
      expect(
        client.getQueryData(["dogProfiles", "owner", "b"]),
      ).toBeUndefined(),
    );
  });
});
