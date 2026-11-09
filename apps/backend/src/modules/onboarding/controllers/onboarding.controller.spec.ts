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
import { OnboardingService } from "@/modules/onboarding/services/onboarding.service";
import { getSessionFromRequest } from "@/shared/auth/utils/get-session-from-request";
import { OnboardingController } from "./onboarding.controller";

vi.mock("@/shared/auth/providers/better-auth.provider", async () => {
  const { Inject } = await import("@nestjs/common");
  return { InjectBetterAuth: Inject("BetterAuth") };
});
vi.mock("@/shared/auth/utils/get-session-from-request", () => ({
  getSessionFromRequest: vi.fn(),
}));

describe("/api/onboarding", () => {
  let app: INestApplication;
  let url: string;
  const getSession = vi.mocked(getSessionFromRequest);
  const prisma = {
    user: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
    dog: { findFirst: vi.fn() },
    dogGoal: { count: vi.fn() },
    dogExercise: { count: vi.fn() },
    scheduledExercise: { count: vi.fn() },
    $transaction: (action: (tx: unknown) => unknown) => action(prisma),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [OnboardingController],
      providers: [
        OnboardingService,
        { provide: PrismaService, useValue: prisma },
        { provide: "BetterAuth", useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    await app.listen(0, "127.0.0.1");
    url = `${await app.getUrl()}/api/onboarding`;
  });

  beforeEach(() => {
    vi.resetAllMocks();
    getSession.mockResolvedValue({
      user: { id: "user-a", role: "user", emailVerified: true },
    } as NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>);
    prisma.dog.findFirst.mockResolvedValue({
      id: "dog-a",
      disciplines: [],
      scheduledExercises: [],
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  const send = (method: string, path: string, body?: unknown) =>
    fetch(`${url}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  it("rejects unauthenticated requests", async () => {
    getSession.mockResolvedValue(null);
    const response = await send("GET", "?weekStart=2026-11-02T00:00:00.000Z");
    expect(response.status).toBe(401);
  });

  it("returns the tour state and progress for this week", async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      onboardingStatus: "dismissed",
      onboardingStep: "assignDiscipline",
      onboardingCardHidden: false,
    });
    prisma.dog.findFirst.mockResolvedValue({
      id: "dog-a",
      disciplines: [{ disciplineId: "disc-a" }],
      scheduledExercises: [],
    });
    prisma.dogGoal.count.mockResolvedValue(1);
    prisma.dogExercise.count.mockResolvedValue(0);
    prisma.scheduledExercise.count.mockResolvedValue(0);

    const response = await send("GET", "?weekStart=2026-11-02T00:00:00.000Z");

    expect(await response.json()).toEqual({
      status: "dismissed",
      step: "assignDiscipline",
      cardHidden: false,
      hasDog: true,
      hasDiscipline: true,
      hasWeekPlan: false,
      dogId: "dog-a",
      disciplineId: "disc-a",
      eventId: null,
      eventStartsAt: null,
      hasGoal: true,
      hasExercise: false,
    });
    expect(prisma.scheduledExercise.count).toHaveBeenCalledWith({
      where: {
        dog: { userId: "user-a", archivedAt: null },
        deletedAt: null,
        startsAt: {
          gte: new Date("2026-11-02T00:00:00.000Z"),
          lt: new Date("2026-11-09T00:00:00.000Z"),
        },
      },
    });
    // Goals and exercises count for the discipline being set up only.
    expect(prisma.dogGoal.count).toHaveBeenCalledWith({
      where: { dogId: "dog-a", goal: { disciplineId: "disc-a" } },
    });
    expect(prisma.dogExercise.count).toHaveBeenCalledWith({
      where: { dogId: "dog-a", dogGoal: { goal: { disciplineId: "disc-a" } } },
    });
  });

  it("counts no discipline when only an older dog has one", async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      onboardingStatus: "active",
      onboardingStep: "assignDiscipline",
      onboardingCardHidden: false,
    });
    prisma.scheduledExercise.count.mockResolvedValue(0);

    const response = await send("GET", "?weekStart=2026-11-02T00:00:00.000Z");

    expect(await response.json()).toMatchObject({
      hasDiscipline: false,
      hasGoal: false,
      hasExercise: false,
    });
    expect(prisma.dogGoal.count).not.toHaveBeenCalled();
  });

  it("updates only the signed-in user's tour", async () => {
    prisma.user.update.mockResolvedValue({
      onboardingStatus: "active",
      onboardingStep: "addDog",
      onboardingCardHidden: false,
    });

    const response = await send("PATCH", "", {
      status: "active",
      step: "addDog",
    });

    expect(response.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-a" },
        data: {
          onboardingStatus: "active",
          onboardingStep: "addDog",
          onboardingCardHidden: undefined,
        },
      }),
    );
  });

  it("rejects an unknown status", async () => {
    const response = await send("PATCH", "", { status: "done" });
    expect(response.status).toBe(400);
  });
});
