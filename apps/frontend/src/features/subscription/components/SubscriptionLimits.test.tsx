import { Button } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, useAtomValue } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { addDogDialogOpenAtom } from "@/features/dogs/atoms/addDogDialogOpenAtom";
import { AddDogButton } from "@/features/dogs/components/AddDogDialog";
import type { Subscription } from "@/features/settings/api/subscriptionQueryOptions";
import { subscriptionQueryOptions } from "@/features/settings/api/subscriptionQueryOptions";
import { usePlusOffer } from "@/features/subscription/hooks/useSubscription";
import { ExerciseVideos } from "@/features/videos/components/ExerciseVideos";

import { SubscriptionDialogs } from "./SubscriptionDialogs";

const state = vi.hoisted(() => ({
  data: {} as Subscription,
  calls: vi.fn(),
  continue: vi.fn(),
  dismiss: vi.fn(),
  hang: false,
  choices: "ok" as "ok" | "empty" | "error",
}));
vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "owner" } }),
}));
vi.mock("@/lib/api-client", () => ({
  api: {
    get: (path: string) => ({
      json: async () => {
        state.calls(path);
        if (path === "users/me/subscription") {
          if (state.hang) return new Promise(() => {});
          return state.data;
        }
        if (path === "users/me/subscription/dog-choices") {
          if (state.choices === "error") throw new Error("offline");
          if (state.choices === "empty") return [];
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
        if (path === "dogs/a/sessions/s/videos") {
          return [
            {
              id: "v1",
              status: "completed",
              duration: 12,
              error: null,
              createdAt: "2026-11-01T00:00:00Z",
              updatedAt: "2026-11-01T00:00:00Z",
            },
          ];
        }
        throw new Error(`Unexpected request: ${path}`);
      },
    }),
    delete: async (path: string) => {
      state.calls(`DELETE ${path}`);
    },
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
      onPress={() =>
        offer({
          reason: "dogs",
          onSuccess: state.continue,
          onDismiss: state.dismiss,
        })
      }
    >
      Add dog
    </Button>
  );
}
function AddDogProbe() {
  return useAtomValue(addDogDialogOpenAtom) ? <p>add dog form</p> : null;
}
function setup({
  videos = false,
  addDog = false,
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
} = {}) {
  return {
    ...render(
      <Provider>
        <QueryClientProvider client={client}>
          <Trigger />
          {addDog && (
            <>
              <AddDogButton />
              <AddDogProbe />
            </>
          )}
          {videos && (
            <ExerciseVideos
              dogId="a"
              sessionId="s"
              tileHasVideo={false}
              onBusyChange={() => {}}
            />
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
      dogLimit: 1,
      plusDogLimit: 5,
      goalLimit: 2,
    };
    state.calls.mockClear();
    state.continue.mockClear();
    state.dismiss.mockClear();
    state.hang = false;
    state.choices = "ok";
  });
  it.each([
    ["error", "Could not load your dogs."],
    ["empty", "You have no dog to choose."],
  ] as const)(
    "explains a %s dog list in the active-dog choice",
    async (choices, text) => {
      state.choices = choices;
      state.data = {
        ...state.data,
        needsDogChoice: true,
        activeDogId: null,
        dogs: 2,
      };
      setup();
      const dialog = await screen.findByRole("dialog");
      expect(await within(dialog).findByText(text)).toBeVisible();
      expect(
        within(dialog).getByRole("button", { name: "Confirm selection" }),
      ).toBeDisabled();
    },
  );
  it("keeps cached data when the first active dog appears, but clears it when the active dog changes", async () => {
    state.data = { ...state.data, activeDogId: null, dogs: 0 };
    const { client } = setup();
    const key = subscriptionQueryOptions("owner").queryKey;
    await waitFor(() => expect(client.getQueryData(key)).toBeDefined());
    client.setQueryData(["dogs", "owner"], [{ id: "a" }]);

    state.data = { ...state.data, activeDogId: "a", dogs: 1 };
    await client.refetchQueries({ queryKey: key });
    await waitFor(() =>
      expect(client.getQueryData(key)).toMatchObject({ activeDogId: "a" }),
    );
    expect(client.getQueryData(["dogs", "owner"])).toEqual([{ id: "a" }]);

    state.data = { ...state.data, activeDogId: "b" };
    await client.refetchQueries({ queryKey: key });
    await waitFor(() =>
      expect(client.getQueryData(["dogs", "owner"])).toBeUndefined(),
    );
  });
  it("never shows the video lock while the plan is still loading", async () => {
    state.hang = true;
    setup({ videos: true });
    expect(await screen.findByText("Loading videos…")).toBeVisible();
    expect(
      screen.queryByText("Exercise videos with Plus"),
    ).not.toBeInTheDocument();
  });
  it("opens the add-dog form below the limit without offering Plus", async () => {
    state.data = { ...state.data, dogs: 0 };
    const { user } = setup({ addDog: true });
    await waitFor(() => expect(state.calls).toHaveBeenCalled());
    // The first "Add dog" button is the offer trigger; the second is the sidebar one.
    const [, sidebarButton] = screen.getAllByRole("button", {
      name: "Add dog",
    });
    await user.click(sidebarButton!);
    expect(await screen.findByText("add dog form")).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("disables adding a dog for Plus at its dog limit instead of offering Plus", async () => {
    state.data = {
      ...state.data,
      status: "active",
      isPlus: true,
      dogs: 5,
      dogLimit: 5,
      goalLimit: null,
    };
    setup({ addDog: true });
    expect(
      await screen.findByText(
        "You have the maximum of 5 dogs. Archive one to make room.",
      ),
    ).toBeVisible();
    const buttons = screen.getAllByRole("button", { name: "Add dog" });
    expect(buttons.at(-1)).toBeDisabled();
  });
  it("keeps the offer open with an alert when the mock payment is declined", async () => {
    state.data = { ...state.data, trialUsed: true };
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Add dog" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Continue to payment" }),
    );
    await user.click(
      within(dialog).getByRole("radio", { name: "Declined payment" }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Confirm mock payment" }),
    );
    expect(within(dialog).getByText("Payment declined")).toBeVisible();
    expect(state.calls).not.toHaveBeenCalledWith(
      "users/me/subscription",
      expect.anything(),
    );
    expect(state.continue).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Not now" }));
    expect(state.dismiss).toHaveBeenCalledOnce();
  });
  it("offers a card-free trial with the selected plan and continues the original action", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Add dog" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Up to 5 dogs with Plus")).toBeVisible();
    expect(
      within(dialog).getByText(
        "Free plan dog limit: 1. With Plus you can have up to 5.",
      ),
    ).toBeVisible();
    await user.click(
      within(dialog).getByRole("radio", { name: "Monthly · CZK 69" }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Try 14 days free" }),
    );
    await waitFor(() => expect(state.continue).toHaveBeenCalledOnce());
    expect(state.dismiss).not.toHaveBeenCalled();
    expect(state.calls).toHaveBeenCalledWith("users/me/subscription", {
      action: "trial",
      billingPeriod: "monthly",
    });
  });
  it("keeps saved videos deletable but not playable after Plus ends", async () => {
    const { user } = setup({ videos: true });
    expect(await screen.findByText("Exercise videos with Plus")).toBeVisible();
    expect(
      await screen.findByRole("button", { name: "Play video 1" }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        "You can delete saved videos. Playing them requires Plus.",
      ),
    ).toBeVisible();
    expect(
      state.calls.mock.calls.every(
        ([path]) => !String(path).includes("playback"),
      ),
    ).toBe(true);
    await user.click(screen.getByRole("button", { name: "Remove video 1" }));
    await waitFor(() =>
      expect(state.calls).toHaveBeenCalledWith(
        "DELETE dogs/a/sessions/s/videos/v1",
      ),
    );
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
