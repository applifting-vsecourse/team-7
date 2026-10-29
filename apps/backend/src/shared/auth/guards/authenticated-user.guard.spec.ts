import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { BetterAuth } from "@/shared/auth/providers/better-auth.provider";
import { getSessionFromRequest } from "@/shared/auth/utils/get-session-from-request";
import { AuthenticatedUserGuard } from "./authenticated-user.guard";

vi.mock("@/shared/auth/providers/better-auth.provider", async () => {
  const { Inject } = await import("@nestjs/common");
  return { InjectBetterAuth: Inject("BetterAuth") };
});
vi.mock("@/shared/auth/utils/get-session-from-request", () => ({
  getSessionFromRequest: vi.fn(),
}));

type Session = Awaited<ReturnType<typeof getSessionFromRequest>>;

const run = (session: unknown) => {
  vi.mocked(getSessionFromRequest).mockResolvedValue(session as Session);
  const request: { session?: unknown } = {};
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
  const guard = new AuthenticatedUserGuard({} as BetterAuth);
  return { result: guard.canActivate(context), request };
};

describe("AuthenticatedUserGuard", () => {
  it("rejects anonymous requests with 401", async () => {
    await expect(run(null).result).rejects.toThrow(UnauthorizedException);
  });

  it("rejects unverified users with 403", async () => {
    const session = { user: { id: "u", emailVerified: false } };
    await expect(run(session).result).rejects.toThrow(ForbiddenException);
  });

  it("lets verified users through and attaches the session", async () => {
    const session = { user: { id: "u", emailVerified: true } };
    const { result, request } = run(session);
    await expect(result).resolves.toBe(true);
    expect(request.session).toBe(session);
  });
});
