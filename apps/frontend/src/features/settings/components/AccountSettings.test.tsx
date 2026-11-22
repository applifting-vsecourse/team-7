import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountSettings } from "./AccountSettings";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  listAccounts: vi.fn(),
  updateUser: vi.fn(),
  changeEmail: vi.fn(),
  changePassword: vi.fn(),
  deleteUser: vi.fn(),
  signOut: vi.fn(),
  navigate: vi.fn(),
  cancelEmailChange: vi.fn(),
  pending: null as { id: string; email: string; expiresAt: string } | null,
  pendingLoadError: false,
}));
vi.mock("@/features/auth/lib/auth-client", () => ({ authClient: mocks }));
vi.mock("@tanstack/react-router", async (original) => ({
  ...(await original<object>()),
  useNavigate: () => mocks.navigate,
}));
vi.mock("@/lib/api-client", () => ({
  api: {
    delete: async (path: string) => {
      await mocks.cancelEmailChange(path);
      mocks.pending = null;
    },
    get: (path: string) => ({
      json: async () => {
        if (path.endsWith("subscription")) {
          return {
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
            dogLimit: 1,
            plusDogLimit: 5,
            goalLimit: 2,
            dogs: 1,
            goals: 2,
          };
        }
        if (path.endsWith("email-change")) {
          if (mocks.pendingLoadError) throw new Error("offline");
          return { pendingEmailChange: mocks.pending };
        }
        return path.endsWith("summary")
          ? { dogs: 4, disciplines: 5, exercises: 126, videos: 7 }
          : { emailNotificationsEnabled: true };
      },
    }),
  },
}));

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <AccountSettings userId="owner" />
    </QueryClientProvider>,
  );
  return { ...view, client, user: userEvent.setup() };
}

describe("account settings", () => {
  it.each(["API", "NETWORK"])(
    "reports a saved name when the email request fails: %s",
    async (failure) => {
      if (failure === "API") {
        mocks.changeEmail.mockResolvedValueOnce({ error: { code: "UNKNOWN" } });
      } else {
        mocks.changeEmail.mockRejectedValueOnce(new Error("offline"));
      }
      const { user } = setup();
      const name = await screen.findByRole("textbox", { name: "Name" });
      await user.clear(name);
      await user.type(name, "Jana Nová");
      const email = screen.getByRole("textbox", { name: "Email" });
      await user.clear(email);
      await user.type(email, "new@example.com");
      await user.click(screen.getByRole("button", { name: "Save changes" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Your name was saved, but we could not request the email change.",
      );
      expect(name).toHaveValue("Jana Nová");
      expect(email).toHaveValue("new@example.com");
    },
  );

  it("deletes a Google-only account without a password", async () => {
    mocks.listAccounts.mockResolvedValue({ data: [{ providerId: "google" }] });
    const { user } = setup();
    await user.click(
      await screen.findByRole("button", { name: "Delete account" }),
    );
    const dialog = within(await screen.findByRole("dialog"));
    await dialog.findByText("Videos: 7");
    expect(dialog.queryByLabelText("Current password")).not.toBeInTheDocument();
    await user.type(dialog.getByRole("textbox"), "jana@example.com");
    await user.click(dialog.getByRole("button", { name: "Delete account" }));
    await waitFor(() =>
      expect(mocks.deleteUser).toHaveBeenCalledExactlyOnceWith(undefined),
    );
  });

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.pending = null;
    mocks.pendingLoadError = false;
    mocks.getSession.mockResolvedValue({
      data: {
        user: {
          id: "owner",
          name: "Jana",
          email: "jana@example.com",
          emailVerified: true,
        },
      },
    });
    mocks.listAccounts.mockResolvedValue({
      data: [{ providerId: "credential" }],
    });
    for (const method of [
      mocks.updateUser,
      mocks.changeEmail,
      mocks.changePassword,
      mocks.deleteUser,
      mocks.signOut,
    ]) {
      method.mockResolvedValue({ data: { status: true } });
    }
    mocks.changeEmail.mockImplementation(
      ({ newEmail }: { newEmail: string }) => {
        mocks.pending = {
          id: "a".repeat(32),
          email: newEmail,
          expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        };
        return Promise.resolve({ data: { status: true } });
      },
    );
  });

  it("saves a profile and requests verification of a new email", async () => {
    const { user } = setup();
    const name = await screen.findByRole("textbox", { name: "Name" });
    await user.clear(name);
    await user.type(name, "Jana Nová");
    const email = screen.getByRole("textbox", { name: "Email" });
    await user.clear(email);
    await user.type(email, "nova@example.com");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(mocks.updateUser).toHaveBeenCalledWith({ name: "Jana Nová" }),
    );
    expect(mocks.changeEmail).toHaveBeenCalledWith({
      newEmail: "nova@example.com",
      callbackURL: `${window.location.origin}/settings?lng=en`,
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Awaiting confirmation: nova@example.com",
    );
  });

  it("restores a pending change after revisiting and cancels it without submitting the profile", async () => {
    mocks.pending = {
      id: "a".repeat(32),
      email: "new@example.com",
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    };
    const first = setup();
    expect(
      await screen.findByText("Awaiting confirmation: new@example.com"),
    ).toBeInTheDocument();
    first.unmount();
    const second = setup();
    await second.user.click(
      await screen.findByRole("button", { name: "Cancel change" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    );
    expect(mocks.cancelEmailChange).toHaveBeenCalledWith(
      `users/me/settings/email-change/${"a".repeat(32)}`,
    );
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue(
      "jana@example.com",
    );
    second.unmount();
    setup();
    await screen.findByRole("textbox", { name: "Name" });
    expect(
      screen.queryByText("Awaiting confirmation: new@example.com"),
    ).not.toBeInTheDocument();
  });

  it("keeps a failed cancellation visible and allows retry", async () => {
    mocks.pending = {
      id: "a".repeat(32),
      email: "new@example.com",
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    };
    mocks.cancelEmailChange.mockRejectedValueOnce(new Error("offline"));
    const { user } = setup();
    await user.click(
      await screen.findByRole("button", { name: "Cancel change" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not cancel this email change.",
    );
    expect(screen.getByRole("status")).toHaveTextContent("new@example.com");
    await user.click(screen.getByRole("button", { name: "Cancel change" }));
    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    );
  });

  it("keeps profile edits on a background refresh", async () => {
    const { user, client } = setup();
    const name = await screen.findByRole("textbox", { name: "Name" });
    await user.clear(name);
    await user.type(name, "Unsaved name");
    await client.invalidateQueries({ queryKey: ["auth", "session"] });
    expect(name).toHaveValue("Unsaved name");
  });

  it("makes Google-only email read-only and hides password changes", async () => {
    mocks.listAccounts.mockResolvedValue({ data: [{ providerId: "google" }] });
    setup();
    expect(
      await screen.findByRole("textbox", { name: "Email" }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        "You sign in with Google. Change your email in your Google account.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Change password" }),
    ).not.toBeInTheDocument();
  });

  it("validates password confirmation and revokes other sessions on success", async () => {
    const { user } = setup();
    await screen.findByRole("textbox", { name: "Name" });
    await user.type(screen.getByLabelText("Current password"), "old password");
    await user.type(
      screen.getByLabelText("New password", { exact: true }),
      "new password",
    );
    await user.type(screen.getByLabelText("Repeat new password"), "different");
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(mocks.changePassword).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText("Repeat new password"));
    await user.type(
      screen.getByLabelText("Repeat new password"),
      "new password",
    );
    await user.click(screen.getByRole("button", { name: "Change password" }));
    await waitFor(() =>
      expect(mocks.changePassword).toHaveBeenCalledWith({
        currentPassword: "old password",
        newPassword: "new password",
        revokeOtherSessions: true,
      }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Current password")).toHaveValue(""),
    );
  });

  it.each(["INVALID_PASSWORD", "UNKNOWN", "NETWORK"])(
    "preserves password fields after %s and allows retry",
    async (code) => {
      if (code === "NETWORK") {
        mocks.changePassword.mockRejectedValueOnce(new Error("offline"));
      } else {
        mocks.changePassword.mockResolvedValueOnce({ error: { code } });
      }
      const { user } = setup();
      await screen.findByRole("textbox", { name: "Name" });
      const currentPassword = screen.getByLabelText("Current password");
      await user.type(currentPassword, "old password");
      await user.type(
        screen.getByLabelText("New password", { exact: true }),
        "new password",
      );
      await user.type(
        screen.getByLabelText("Repeat new password"),
        "new password",
      );
      await user.click(screen.getByRole("button", { name: "Change password" }));
      if (code === "INVALID_PASSWORD") {
        expect(
          await screen.findByText("The current password is incorrect."),
        ).toBeInTheDocument();
        await waitFor(() => expect(currentPassword).toHaveFocus());
      } else {
        expect(await screen.findByRole("alert")).toHaveTextContent(
          "Could not change your password.",
        );
      }
      expect(currentPassword).toHaveValue("old password");
      expect(
        screen.getByLabelText("New password", { exact: true }),
      ).toHaveValue("new password");
      await user.click(screen.getByRole("button", { name: "Change password" }));
      await waitFor(() => expect(currentPassword).toHaveValue(""));
      expect(mocks.changePassword).toHaveBeenCalledTimes(2);
    },
  );

  it("requires typed confirmation before deleting and clears cached private data", async () => {
    const { user, client } = setup();
    const clearCache = vi.spyOn(client, "clear");
    await user.click(
      await screen.findByRole("button", {
        name: "Delete account",
      }),
    );
    const dialog = within(await screen.findByRole("dialog"));
    expect(
      await dialog.findByText("Dogs, including archived: 4"),
    ).toBeInTheDocument();
    await user.click(dialog.getByRole("button", { name: "Delete account" }));
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(
      await dialog.findByText("Type your account email exactly to confirm."),
    ).toBeInTheDocument();
    await user.type(dialog.getByRole("textbox"), "jana@example.com");
    await user.type(dialog.getByLabelText("Current password"), "old password");
    await user.click(dialog.getByRole("button", { name: "Delete account" }));
    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith({ to: "/login" }),
    );
    expect(mocks.deleteUser).toHaveBeenCalledExactlyOnceWith({
      password: "old password",
    });
    expect(clearCache).toHaveBeenCalledOnce();
  });

  it("keeps a failed deletion open for retry", async () => {
    mocks.deleteUser.mockResolvedValue({ error: { code: "UNKNOWN" } });
    const { user } = setup();
    await user.click(
      await screen.findByRole("button", {
        name: "Delete account",
      }),
    );
    const dialog = within(await screen.findByRole("dialog"));
    await dialog.findByText("Videos: 7");
    await user.type(dialog.getByRole("textbox"), "jana@example.com");
    await user.type(dialog.getByLabelText("Current password"), "old password");
    await user.click(dialog.getByRole("button", { name: "Delete account" }));
    expect(await dialog.findByRole("alert")).toHaveTextContent(
      "Could not delete your account.",
    );
    expect(dialog.getByRole("textbox")).toHaveValue("jana@example.com");
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
