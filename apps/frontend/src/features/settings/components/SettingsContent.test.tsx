import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsContent } from "./SettingsContent";

const state = vi.hoisted(() => ({
  enabled: true,
  loadError: false,
  saveError: false,
  save: vi.fn(),
}));
vi.mock("@/lib/api-client", () => ({
  api: {
    get: () => ({
      json: async () => {
        if (state.loadError) throw new Error("offline");
        return { emailNotificationsEnabled: state.enabled };
      },
    }),
    patch: (
      path: string,
      options: { json: { emailNotificationsEnabled: boolean } },
    ) => ({
      json: async () => {
        state.save(path, options);
        if (state.saveError) throw new Error("offline");
        state.enabled = options.json.emailNotificationsEnabled;
        return { emailNotificationsEnabled: state.enabled };
      },
    }),
  },
}));

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <SettingsContent userId="owner" />
    </QueryClientProvider>,
  );
  return { ...view, client, user: userEvent.setup() };
}

describe("email notification settings", () => {
  beforeEach(() => {
    state.enabled = true;
    state.loadError = false;
    state.saveError = false;
    state.save.mockClear();
  });

  it("loads the saved preference, opts out, and can opt back in after revisiting", async () => {
    const first = setup();
    const checkbox = await screen.findByRole("checkbox", {
      name: "Receive email notifications",
    });
    expect(checkbox).toBeChecked();
    await first.user.click(checkbox);
    await first.user.click(
      screen.getByRole("button", { name: "Save changes" }),
    );
    await waitFor(() =>
      expect(state.save).toHaveBeenCalledWith("users/me/settings", {
        json: { emailNotificationsEnabled: false },
      }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Save changes" }),
      ).toBeEnabled(),
    );
    expect(checkbox).not.toBeChecked();
    first.unmount();

    const second = setup();
    const savedCheckbox = await screen.findByRole("checkbox", {
      name: "Receive email notifications",
    });
    expect(savedCheckbox).not.toBeChecked();
    await second.user.click(savedCheckbox);
    await second.user.click(
      screen.getByRole("button", { name: "Save changes" }),
    );
    await waitFor(() =>
      expect(state.save).toHaveBeenLastCalledWith("users/me/settings", {
        json: { emailNotificationsEnabled: true },
      }),
    );
  });

  it("keeps unsaved edits when a background refetch arrives", async () => {
    const { user, client } = setup();
    const checkbox = await screen.findByRole("checkbox", {
      name: "Receive email notifications",
    });
    await user.click(checkbox);
    await client.invalidateQueries({ queryKey: ["userSettings", "owner"] });
    expect(checkbox).not.toBeChecked();
    expect(state.save).not.toHaveBeenCalled();
  });

  it("shows load failures and retries", async () => {
    state.loadError = true;
    const { user } = setup();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load settings.",
    );
    state.loadError = false;
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("checkbox", {
        name: "Receive email notifications",
      }),
    ).toBeChecked();
  });

  it("keeps the edited value after a failed save and allows retry", async () => {
    state.saveError = true;
    const { user } = setup();
    const checkbox = await screen.findByRole("checkbox", {
      name: "Receive email notifications",
    });
    await user.click(checkbox);
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not save settings.",
    );
    expect(checkbox).not.toBeChecked();
    expect(state.enabled).toBe(true);
    state.saveError = false;
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(state.enabled).toBe(false));
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
  });
});
