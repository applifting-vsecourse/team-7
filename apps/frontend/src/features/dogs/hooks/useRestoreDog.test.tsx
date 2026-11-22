import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { subscriptionQueryOptions } from "@/features/settings/api/subscriptionQueryOptions";

import { useRestoreDog } from "./useRestoreDog";

vi.mock("@/lib/api-client", () => ({ api: { post: vi.fn(async () => ({})) } }));
vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "owner" } }),
}));

describe("useRestoreDog", () => {
  it("reloads the subscription, whose dog count drives the limits", async () => {
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useRestoreDog(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    await result.current({ id: "dog-1", name: "Mája" });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: subscriptionQueryOptions("owner").queryKey,
    });
  });
});
