import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Subscription } from "@/features/settings/api/subscriptionQueryOptions";

import { SubscriptionSettings } from "./SubscriptionSettings";

const state = vi.hoisted(() => ({
  data: {} as Subscription,
  save: vi.fn(),
  loadError: false,
  saveError: false,
}));
vi.mock("@/lib/api-client", () => ({
  api: {
    get: () => ({
      json: async () => {
        if (state.loadError) throw new Error("offline");
        return state.data;
      },
    }),
    post: (path: string, { json }: { json: { action: string } }) => ({
      json: async () => {
        state.save(path, json);
        if (state.saveError) throw new Error("offline");
        const action = json.action;
        state.data = {
          ...state.data,
          status:
            action === "trial"
              ? "trial"
              : action === "cancel"
                ? "cancelled"
                : action === "failPayment"
                  ? "pastDue"
                  : "active",
          trialUsed: true,
          trialEndsAt: "2026-12-01T00:00:00.000Z",
          paidUntil: "2027-12-01T00:00:00.000Z",
          retryAt: action === "failPayment" ? "2026-12-04T00:00:00.000Z" : null,
          cardLast4: action === "changeCard" ? "5556" : "4242",
        };
        return state.data;
      },
    }),
  },
}));

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    ...render(
      <QueryClientProvider client={client}>
        <SubscriptionSettings userId="owner" />
      </QueryClientProvider>,
    ),
    user: userEvent.setup(),
  };
}

describe("subscription settings", () => {
  beforeEach(() => {
    state.data = {
      status: "free",
      isPlus: false,
      needsDogChoice: false,
      activeDogId: "dog",
      billingPeriod: "yearly",
      trialEndsAt: null,
      paidUntil: null,
      retryAt: null,
      trialUsed: false,
      cardLast4: "4242",
      freeDogLimit: 1,
      dogs: 1,
      goals: 2,
    };
    state.save.mockReset();
    state.loadError = false;
    state.saveError = false;
  });

  it("displays the Free dog limit returned by the API", async () => {
    state.data.freeDogLimit = 3;
    setup();
    expect(
      await screen.findByText(
        "Free plan limits: dogs (3), goals in progress (2).",
      ),
    ).toBeVisible();
  });

  it("starts a trial and makes the mock nature of checkout explicit", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: "Try Plus" }));
    await user.click(
      await screen.findByRole("button", { name: "Pay for Plus" }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("Mock payment only. No money will be charged."),
    ).toBeVisible();
    expect(within(dialog).queryByRole("textbox")).not.toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: "Confirm mock payment" }),
    );
    expect(await screen.findByText("Visa •••• 4242")).toBeVisible();
    expect(state.save).toHaveBeenLastCalledWith("users/me/subscription", {
      action: "pay",
      billingPeriod: "yearly",
    });
  });

  it("confirms cancellation, retains the paid period, and resumes without checkout", async () => {
    state.data = {
      ...state.data,
      status: "active",
      paidUntil: "2027-12-01T00:00:00.000Z",
    };
    const { user } = setup();
    await user.click(
      await screen.findByRole("button", { name: "Cancel subscription" }),
    );
    let dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(
        "Nothing will be deleted. Renew Plus to unlock everything.",
      ),
    ).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: "Keep Plus" }));
    expect(state.save).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await user.click(
      screen.getByRole("button", { name: "Cancel subscription" }),
    );
    dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Cancel subscription" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Resume subscription" }),
    );
    expect(
      await screen.findByRole("button", { name: "Cancel subscription" }),
    ).toBeVisible();
    expect(state.save).toHaveBeenLastCalledWith("users/me/subscription", {
      action: "resume",
    });
  });

  it("shows a failed mock payment and recovers by changing the test card", async () => {
    state.data = {
      ...state.data,
      status: "trial",
      trialUsed: true,
      trialEndsAt: "2026-12-01T00:00:00.000Z",
    };
    const { user } = setup();
    await user.click(
      await screen.findByRole("button", { name: "Pay for Plus" }),
    );
    let dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("radio", { name: "Declined payment" }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Confirm mock payment" }),
    );
    expect(await screen.findByText("Payment failed")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Change card" }));
    dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Confirm mock payment" }),
    );
    expect(await screen.findByText("Visa •••• 5556")).toBeVisible();
  });

  it("lets users retry loading and preserves the dialog after a save error", async () => {
    state.loadError = true;
    const { user } = setup();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load your subscription.",
    );
    state.loadError = false;
    await user.click(screen.getByRole("button", { name: "Try again" }));
    state.saveError = true;
    await user.click(await screen.findByRole("button", { name: "Try Plus" }));
    expect(
      await screen.findByText(
        "Could not update your subscription. Please try again.",
      ),
    ).toBeVisible();
    state.saveError = false;
    await user.click(screen.getByRole("button", { name: "Try Plus" }));
    await user.click(
      await screen.findByRole("button", { name: "Pay for Plus" }),
    );
    state.saveError = true;
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Confirm mock payment",
      }),
    );
    expect(
      await screen.findByText(
        "Could not update your subscription. Please try again.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("dialog")).toBeVisible();
  });
});
