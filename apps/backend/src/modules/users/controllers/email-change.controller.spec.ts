import { GoneException, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { EmailChangeService } from "@/shared/auth/services/email-change.service";
import { getSessionFromRequest } from "@/shared/auth/utils/get-session-from-request";
import { Config } from "@/shared/config/config.service";
import { EmailChangeConfirmationController } from "./email-change-confirmation.controller";
import { EmailChangeController } from "./email-change.controller";

vi.mock("@/shared/auth/providers/better-auth.provider", async () => {
  const { Inject } = await import("@nestjs/common");
  return { InjectBetterAuth: Inject("BetterAuth") };
});
vi.mock("@/shared/auth/utils/get-session-from-request", () => ({
  getSessionFromRequest: vi.fn(),
}));

describe("email change HTTP boundary", () => {
  let app: INestApplication;
  let base: string;
  const id = "a".repeat(32);
  const changes = { pending: vi.fn(), cancel: vi.fn(), confirm: vi.fn() };
  const auth = { api: { verifyEmail: vi.fn() } };
  const getSession = vi.mocked(getSessionFromRequest);
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [EmailChangeController, EmailChangeConfirmationController],
      providers: [
        { provide: EmailChangeService, useValue: changes },
        { provide: "BetterAuth", useValue: auth },
        {
          provide: Config,
          useValue: { frontendUrl: "https://trainloop.example" },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.listen(0, "127.0.0.1");
    base = await app.getUrl();
  });
  afterAll(async () => {
    await app?.close();
  });
  beforeEach(() => {
    vi.resetAllMocks();
    getSession.mockResolvedValue({
      user: { id: "owner", emailVerified: true, role: "user" },
    } as never);
    changes.pending.mockResolvedValue({
      id,
      email: "new@example.com",
      expiresAt: new Date("2027-01-01T00:00:00Z"),
    });
    changes.cancel.mockResolvedValue(undefined);
    auth.api.verifyEmail.mockResolvedValue(
      new Response("{}", {
        headers: { "Set-Cookie": "session=updated; Path=/; HttpOnly" },
      }),
    );
    changes.confirm.mockImplementation(
      async (
        _secret: string,
        verify: (token: string) => Promise<Response>,
      ) => ({
        response: await verify("private-token"),
        callbackUrl: "https://trainloop.example/settings?lng=cs",
      }),
    );
  });

  it("loads and cancels only for the session user", async () => {
    const loaded = await fetch(
      `${base}/users/me/settings/email-change?userId=other`,
    );
    expect(await loaded.json()).toEqual({
      pendingEmailChange: {
        id,
        email: "new@example.com",
        expiresAt: "2027-01-01T00:00:00.000Z",
      },
    });
    expect(changes.pending).toHaveBeenCalledWith("owner");
    const cancelled = await fetch(
      `${base}/users/me/settings/email-change/${id}`,
      { method: "DELETE" },
    );
    expect(cancelled.status).toBe(204);
    expect(changes.cancel).toHaveBeenCalledWith("owner", id);
  });

  it("requires a verified session for pending changes and cancellation", async () => {
    getSession.mockResolvedValue(null);
    expect((await fetch(`${base}/users/me/settings/email-change`)).status).toBe(
      401,
    );
    expect(
      (
        await fetch(`${base}/users/me/settings/email-change/${id}`, {
          method: "DELETE",
        })
      ).status,
    ).toBe(401);
    getSession.mockResolvedValue({
      user: { id: "owner", emailVerified: false },
    } as never);
    expect(
      (
        await fetch(`${base}/users/me/settings/email-change/${id}`, {
          method: "DELETE",
        })
      ).status,
    ).toBe(403);
    expect(changes.cancel).not.toHaveBeenCalled();
  });

  it("rejects malformed request IDs", async () => {
    expect(
      (
        await fetch(`${base}/users/me/settings/email-change/not-an-id`, {
          method: "DELETE",
        })
      ).status,
    ).toBe(400);
    expect(changes.cancel).not.toHaveBeenCalled();
  });

  it("confirms via the public BetterAuth API and forwards refreshed session cookies", async () => {
    getSession.mockResolvedValue(null);
    const result = await fetch(
      `${base}/users/email-change/confirm?token=${"s".repeat(43)}&lng=cs`,
      { redirect: "manual", headers: { Cookie: "session=original" } },
    );
    expect(result.status).toBe(303);
    expect(result.headers.get("location")).toBe(
      "https://trainloop.example/settings?lng=cs&emailChange=confirmed",
    );
    expect(result.headers.get("set-cookie")).toContain("session=updated");
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(result.headers.get("referrer-policy")).toBe("no-referrer");
    const input = auth.api.verifyEmail.mock.calls[0]![0] as {
      query: { token: string };
      headers: Headers;
      asResponse: boolean;
    };
    expect(input.query).toEqual({ token: "private-token" });
    expect(input.headers.get("cookie")).toBe("session=original");
    expect(input.asResponse).toBe(true);
  });

  it("shows an invalid-link result for a cancelled link without calling BetterAuth", async () => {
    changes.confirm.mockRejectedValue(new GoneException());
    const result = await fetch(
      `${base}/users/email-change/confirm?token=${"s".repeat(43)}&lng=en`,
      { redirect: "manual" },
    );
    expect(result.status).toBe(303);
    expect(result.headers.get("location")).toBe(
      "https://trainloop.example/settings?emailChange=invalid&lng=en",
    );
    expect(auth.api.verifyEmail).not.toHaveBeenCalled();
  });

  it("does not report success if BetterAuth rejects verification", async () => {
    auth.api.verifyEmail.mockResolvedValue(new Response("{}", { status: 401 }));
    const result = await fetch(
      `${base}/users/email-change/confirm?token=${"s".repeat(43)}`,
      { redirect: "manual" },
    );
    expect(result.headers.get("location")).toContain("emailChange=invalid");
    expect(result.headers.get("set-cookie")).toBeNull();
  });
});
