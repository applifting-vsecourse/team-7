import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider, useAtomValue } from "jotai";
import { describe, expect, it, vi } from "vitest";

import { plusOfferAtom } from "@/features/subscription/atoms/plusOfferAtom";

import { useDogProfileMutation } from "./useDogProfileMutation";

vi.mock("@/lib/api-client", () => ({ api: {} }));
vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "owner" } }),
}));

function setup() {
  const limit = Object.assign(new Error("limit"), {
    subscriptionCode: "goalLimit",
  });
  const action = vi
    .fn<() => Promise<string>>()
    .mockRejectedValueOnce(limit)
    .mockResolvedValue("ok");
  const client = new QueryClient();
  const { result } = renderHook(
    () => ({
      save: useDogProfileMutation(action),
      offer: useAtomValue(plusOfferAtom),
    }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <Provider>
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        </Provider>
      ),
    },
  );
  return { result, action, limit };
}

describe("useDogProfileMutation", () => {
  it("retries a limited save inside the caller's promise once Plus starts", async () => {
    const { result, action } = setup();
    let saved: Promise<unknown> | undefined;
    act(() => {
      saved = result.current.save.mutateAsync();
    });
    await waitFor(() => expect(result.current.offer?.reason).toBe("goals"));
    act(() => result.current.offer?.onSuccess?.());
    await expect(saved).resolves.toBe("ok");
    expect(action).toHaveBeenCalledTimes(2);
  });

  it("rejects the caller's promise when the offer is dismissed", async () => {
    const { result, action, limit } = setup();
    let saved: Promise<unknown> | undefined;
    act(() => {
      saved = result.current.save.mutateAsync();
    });
    await waitFor(() => expect(result.current.offer).not.toBeNull());
    act(() => result.current.offer?.onDismiss?.());
    await expect(saved).rejects.toBe(limit);
    expect(action).toHaveBeenCalledOnce();
  });
});
