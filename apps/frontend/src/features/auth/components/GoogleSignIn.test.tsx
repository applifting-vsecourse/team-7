import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GoogleSignIn } from "@/features/auth/components/GoogleSignIn";
import { authClient } from "@/features/auth/lib/auth-client";

vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: { signIn: { social: vi.fn() } },
}));

describe("google sign-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/login?lng=en");
  });

  it("starts Google sign-in with absolute callbacks that keep the language", async () => {
    vi.mocked(authClient.signIn.social).mockReturnValue(new Promise(() => {}));
    render(<GoogleSignIn redirectTo="/overview" onError={vi.fn()} />);
    const button = screen.getByRole("button", { name: "Continue with Google" });
    await userEvent.click(button);
    const origin = window.location.origin;
    expect(authClient.signIn.social).toHaveBeenCalledExactlyOnceWith({
      provider: "google",
      callbackURL: `${origin}/overview?lng=en`,
      errorCallbackURL: `${origin}/login?lng=en`,
    });
    await waitFor(() => expect(button).toBeDisabled());
  });

  it("reports failures and allows retrying", async () => {
    vi.mocked(authClient.signIn.social).mockRejectedValue(new Error("down"));
    const onError = vi.fn();
    render(<GoogleSignIn redirectTo="/overview" onError={onError} />);
    const button = screen.getByRole("button", { name: "Continue with Google" });
    await userEvent.click(button);
    await waitFor(() =>
      expect(onError).toHaveBeenCalledExactlyOnceWith("auth.errors.google"),
    );
    expect(button).toBeEnabled();
  });
});
