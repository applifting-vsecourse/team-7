import { INestApplication } from "@nestjs/common";
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
import { PrismaService } from "@/core/prisma/prisma.service";
import { SubscriptionService } from "@/modules/users/services/subscription.service";
import { getSessionFromRequest } from "@/shared/auth/utils/get-session-from-request";
import { SubscriptionController } from "./subscription.controller";

vi.mock("@/shared/auth/providers/better-auth.provider", async () => {
  const { Inject } = await import("@nestjs/common");
  return { InjectBetterAuth: Inject("BetterAuth") };
});
vi.mock("@/shared/auth/utils/get-session-from-request", () => ({
  getSessionFromRequest: vi.fn(),
}));

describe("mock subscriptions API", () => {
  let app: INestApplication;
  let url: string;
  let record: Record<string, unknown> | null;
  const prisma = {
    subscription: { findUnique: vi.fn(), upsert: vi.fn() },
    dog: { count: vi.fn() },
    dogGoal: { count: vi.fn() },
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        SubscriptionService,
        { provide: PrismaService, useValue: prisma },
        { provide: "BetterAuth", useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.listen(0, "127.0.0.1");
    url = `${await app.getUrl()}/users/me/subscription`;
  });
  afterAll(async () => {
    await app?.close();
  });
  beforeEach(() => {
    vi.resetAllMocks();
    record = null;
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      user: { id: "owner", emailVerified: true, role: "user" },
    } as NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>);
    prisma.subscription.findUnique.mockImplementation(async () => record);
    prisma.subscription.upsert.mockImplementation(
      async ({ create, update }) => {
        record = record
          ? { ...record, ...update }
          : {
              trialEndsAt: null,
              paidUntil: null,
              retryAt: null,
              cancelled: false,
              paymentFailed: false,
              cardLast4: "4242",
              ...create,
            };
        return record;
      },
    );
    prisma.dog.count.mockResolvedValue(1);
    prisma.dogGoal.count.mockResolvedValue(2);
  });
  const post = (body: unknown) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  const act = async (action: string) => (await post({ action })).json();

  it("persists the trial, mock payment, cancellation and resumption for the session owner", async () => {
    expect(await (await fetch(url)).json()).toMatchObject({
      status: "free",
      dogs: 1,
      goals: 2,
      trialUsed: false,
    });
    const trial = await act("trial");
    expect(trial.status).toBe("trial");
    expect(new Date(trial.trialEndsAt).getTime() - Date.now()).toBeGreaterThan(
      13 * 86400_000,
    );
    expect((await post({ action: "trial" })).status).toBe(400);
    const paid = await act("pay");
    expect(paid.status).toBe("active");
    expect(new Date(paid.paidUntil).getTime() - Date.now()).toBeGreaterThan(
      364 * 86400_000,
    );
    expect((await post({ action: "pay" })).status).toBe(400);
    expect(await act("cancel")).toMatchObject({
      status: "cancelled",
      paidUntil: paid.paidUntil,
    });
    expect(await act("resume")).toMatchObject({
      status: "active",
      paidUntil: paid.paidUntil,
    });
    expect(await (await fetch(url)).json()).toMatchObject({ status: "active" });
    expect(prisma.subscription.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { userId: "owner" } }),
    );
    expect(prisma.dogGoal.count).toHaveBeenCalledWith({
      where: {
        dog: { userId: "owner", archivedAt: null },
        status: "in_progress",
      },
    });
  });

  it("simulates declined payments and recovers with a different test card", async () => {
    const failed = await act("failPayment");
    expect(failed.status).toBe("pastDue");
    expect(new Date(failed.retryAt).getTime()).toBeGreaterThan(Date.now());
    expect(await act("changeCard")).toMatchObject({
      status: "active",
      cardLast4: "5556",
      retryAt: null,
    });
  });

  it("preserves the paid period when replacing a card, including after a simulated failure", async () => {
    const paid = await act("pay");
    expect(await act("changeCard")).toMatchObject({
      status: "active",
      paidUntil: paid.paidUntil,
    });
    await act("failPayment");
    expect(await act("changeCard")).toMatchObject({
      status: "active",
      paidUntil: paid.paidUntil,
    });
  });

  it("expires trials and cancelled paid periods without deleting data or allowing a second trial", async () => {
    record = { trialEndsAt: new Date(Date.now() - 1000), paidUntil: null };
    expect(await (await fetch(url)).json()).toMatchObject({
      status: "free",
      trialUsed: true,
    });
    expect((await post({ action: "trial" })).status).toBe(400);
    record = {
      ...record,
      paidUntil: new Date(Date.now() - 1000),
      cancelled: true,
    };
    expect(await (await fetch(url)).json()).toMatchObject({ status: "free" });
  });

  it("rejects invalid actions, another user's ID, and unauthenticated requests", async () => {
    expect((await post({ action: "cancel" })).status).toBe(400);
    expect((await post({ action: "resume" })).status).toBe(400);
    expect((await post({ action: "unknown" })).status).toBe(400);
    expect((await post({ action: "pay", userId: "someone-else" })).status).toBe(
      400,
    );
    vi.mocked(getSessionFromRequest).mockResolvedValue(null);
    expect((await fetch(url)).status).toBe(401);
    expect((await post({ action: "pay" })).status).toBe(401);
  });
});
