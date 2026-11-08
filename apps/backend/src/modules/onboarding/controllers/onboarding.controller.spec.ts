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
import { DogSelectionService } from "@/modules/dogs/services/dog-selection.service";
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
    dogExercise: { count: vi.fn() },
    dogDiscipline: { count: vi.fn() },
    scheduledExercise: { count: vi.fn() },
    discipline: { create: vi.fn() },
    goal: { create: vi.fn() },
    $transaction: (action: (tx: unknown) => unknown) => action(prisma),
  };
  const replace = vi.fn();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [OnboardingController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: DogSelectionService, useValue: { replace } },
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
      archivedAt: null,
      disciplines: [],
      scheduledExercises: [],
    });
    prisma.discipline.create.mockResolvedValue({ id: "disc-1" });
    prisma.goal.create.mockImplementation(
      ({ data }: { data: { exercises: { create: unknown[] } } }) => {
        const id = `goal-${prisma.goal.create.mock.calls.length}`;
        return Promise.resolve({
          id,
          exercises: data.exercises.create.map((_, index) => ({
            id: `${id}-ex-${index}`,
          })),
        });
      },
    );
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
      _count: { goals: 1 },
    });
    prisma.dogExercise.count.mockResolvedValue(0);
    prisma.dogDiscipline.count.mockResolvedValue(1);
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

  it("lists the catalog in the requested language", async () => {
    const en = await (await send("GET", "/catalog?lng=en")).json();
    const cs = await (await send("GET", "/catalog?lng=cs")).json();

    expect(en).toHaveLength(5);
    expect(cs[0].name).toBe("Základy poslušnosti");
    expect(en[0]).toMatchObject({
      key: "obedience",
      name: "Obedience basics",
      goals: [
        {
          id: "0",
          name: "Loose-leash walking",
          exercises: [{ id: "0.0", name: "Attention on name" }, {}, {}],
        },
        {},
        {},
      ],
    });
  });

  it("copies a catalog discipline into the library and assigns the selection", async () => {
    const response = await send("POST", "/catalog/recall", {
      dogId: "dog-a",
      lng: "cs",
      goals: [{ goalId: "1", exerciseIds: ["1.1"] }],
    });

    expect(response.status).toBe(201);
    expect(prisma.discipline.create).toHaveBeenCalledWith({
      data: { userId: "user-a", name: "Spolehlivé přivolání" },
    });
    expect(prisma.goal.create).toHaveBeenCalledTimes(3);
    expect(replace).toHaveBeenCalledWith(
      prisma,
      { userId: "user-a", dogId: "dog-a", disciplineId: "disc-1" },
      [{ goalId: "goal-2", exerciseIds: ["goal-2-ex-1"] }],
    );
  });

  it("rejects an unknown catalog discipline or item", async () => {
    const unknownKey = await send("POST", "/catalog/flyball", {
      dogId: "dog-a",
      lng: "cs",
      goals: [{ goalId: "0", exerciseIds: [] }],
    });
    const unknownItem = await send("POST", "/catalog/recall", {
      dogId: "dog-a",
      lng: "cs",
      goals: [{ goalId: "9", exerciseIds: [] }],
    });

    expect(unknownKey.status).toBe(404);
    expect(unknownItem.status).toBe(400);
    expect(replace).not.toHaveBeenCalled();
  });

  it("does not copy for another user's dog", async () => {
    prisma.dog.findFirst.mockResolvedValue(null);

    const response = await send("POST", "/catalog/recall", {
      dogId: "dog-b",
      lng: "cs",
      goals: [{ goalId: "0", exerciseIds: [] }],
    });

    expect(response.status).toBe(404);
    expect(prisma.discipline.create).not.toHaveBeenCalled();
  });
});
