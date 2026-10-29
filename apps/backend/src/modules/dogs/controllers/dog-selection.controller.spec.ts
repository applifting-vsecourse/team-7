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
import { DogSelectionController } from "./dog-selection.controller";

vi.mock("@/shared/auth/providers/better-auth.provider", async () => {
  const { Inject } = await import("@nestjs/common");
  return { InjectBetterAuth: Inject("BetterAuth") };
});
vi.mock("@/shared/auth/utils/get-session-from-request", () => ({
  getSessionFromRequest: vi.fn(),
}));

describe("dog discipline selections API", () => {
  let app: INestApplication;
  let url: string;
  const getSession = vi.mocked(getSessionFromRequest);
  const prisma = {
    $transaction: vi.fn(),
    dog: { findFirst: vi.fn() },
    discipline: { findFirst: vi.fn() },
    goal: { findMany: vi.fn() },
    dogDiscipline: { upsert: vi.fn(), deleteMany: vi.fn() },
    dogGoal: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    scheduledExercise: { updateMany: vi.fn() },
    dogExercise: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  };
  const base = "/dogs/dog-a/disciplines/d1";
  const completedAt = new Date("2026-01-01");
  const assignment = {
    dogId: "dog-a",
    goalId: "g1",
    completedAt,
    exercises: [
      {
        dogId: "dog-a",
        goalId: "g1",
        exerciseId: "e1",
        exercise: { id: "e1" },
      },
    ],
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [DogSelectionController],
      providers: [
        DogSelectionService,
        { provide: PrismaService, useValue: prisma },
        { provide: "BetterAuth", useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    await app.listen(0, "127.0.0.1");
    url = `${await app.getUrl()}/api`;
  });

  beforeEach(() => {
    vi.resetAllMocks();
    getSession.mockResolvedValue({
      user: { id: "user-a", role: "user", emailVerified: true },
    } as NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>);
    prisma.$transaction.mockImplementation(async (action) => action(prisma));
    prisma.dog.findFirst.mockResolvedValue({ id: "dog-a" });
    prisma.discipline.findFirst.mockResolvedValue({ id: "d1" });
    prisma.goal.findMany.mockResolvedValue([
      { id: "g1", exercises: [{ id: "e1" }] },
    ]);
    prisma.dogGoal.findFirst.mockResolvedValue(assignment);
    prisma.dogGoal.findMany.mockResolvedValue([assignment]);
  });

  it("keeps an empty discipline assigned and scopes it to the authenticated owner", async () => {
    prisma.dogDiscipline.upsert.mockResolvedValue({
      dogId: "dog-a",
      disciplineId: "d1",
    });
    const response = await request("POST", "");
    expect(response.status).toBe(201);
    expect(prisma.dog.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "dog-a", userId: "user-a" } }),
    );
    expect(prisma.discipline.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "d1", userId: "user-a" } }),
    );
    expect(prisma.dogDiscipline.upsert).toHaveBeenCalledWith({
      where: { dogId_disciplineId: { dogId: "dog-a", disciplineId: "d1" } },
      create: { dogId: "dog-a", disciplineId: "d1" },
      update: {},
    });
  });

  it("unassigns a discipline and its selections without deleting library content", async () => {
    const response = await request("DELETE", "");
    expect(response.status).toBe(204);
    expect(prisma.dogGoal.deleteMany).toHaveBeenCalledWith({
      where: { dogId: "dog-a", goal: { disciplineId: "d1" } },
    });
    expect(prisma.dogDiscipline.deleteMany).toHaveBeenCalledWith({
      where: { dogId: "dog-a", disciplineId: "d1" },
    });
    expect(prisma.scheduledExercise.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          dogId: "dog-a",
          completedAt: null,
          deletedAt: null,
          startsAt: { gte: expect.any(Date) },
          exercise: {
            goal: { disciplineId: "d1" },
            dogs: { none: { dogId: "dog-a" } },
          },
        },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          undoToken: null,
        }),
      }),
    );
  });

  it("does not assign a discipline owned by someone else", async () => {
    prisma.discipline.findFirst.mockResolvedValueOnce(null);
    expect((await request("POST", "")).status).toBe(404);
    expect(prisma.dogDiscipline.upsert).not.toHaveBeenCalled();
  });

  afterAll(async () => {
    await app?.close();
  });

  function request(method: string, path: string, body?: unknown) {
    return fetch(`${url}${base}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  it("requires a session before querying the database", async () => {
    getSession.mockResolvedValue(null);
    expect((await request("GET", "/selection")).status).toBe(401);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each(["dog", "discipline"] as const)(
    "rejects an inaccessible %s before writing",
    async (model) => {
      prisma[model].findFirst.mockResolvedValue(null);
      expect((await request("PUT", "/selection", { goals: [] })).status).toBe(
        404,
      );
      expect(prisma.dogGoal.deleteMany).not.toHaveBeenCalled();
    },
  );

  it("reads only the session owner's dog and discipline", async () => {
    const response = await request("GET", "/selection");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      goals: [JSON.parse(JSON.stringify(assignment))],
    });
    expect(prisma.dog.findFirst).toHaveBeenCalledWith({
      where: { id: "dog-a", userId: "user-a" },
      select: { id: true },
    });
    expect(prisma.discipline.findFirst).toHaveBeenCalledWith({
      where: { id: "d1", userId: "user-a" },
      select: { id: true },
    });
  });

  it.each([
    {},
    { goals: null },
    { goals: [{ goalId: "g1" }] },
    { goals: [{ goalId: "g1", exerciseIds: ["e1", "e1"] }] },
    {
      goals: [
        { goalId: "g1", exerciseIds: [] },
        { goalId: "g1", exerciseIds: [] },
      ],
    },
    { goals: [{ goalId: "g1", exerciseIds: [], completedAt: "2026-01-01" }] },
    { goals: [], userId: "user-b" },
  ])("rejects malformed selection %o", async (body) => {
    expect((await request("PUT", "/selection", body)).status).toBe(400);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each([
    { goalId: "foreign-goal", exerciseIds: [] },
    { goalId: "g1", exerciseIds: ["foreign-exercise"] },
  ])("rejects invalid hierarchy before any writes: %o", async (goal) => {
    expect((await request("PUT", "/selection", { goals: [goal] })).status).toBe(
      400,
    );
    expect(prisma.goal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { disciplineId: "d1", id: { in: [goal.goalId] } },
      }),
    );
    expect(prisma.dogGoal.deleteMany).not.toHaveBeenCalled();
    expect(prisma.dogGoal.upsert).not.toHaveBeenCalled();
  });

  it("clears unassigned sessions once after all goals in a batch are saved", async () => {
    prisma.goal.findMany.mockResolvedValue([
      { id: "g1", exercises: [{ id: "e1" }] },
      { id: "g2", exercises: [{ id: "e2" }] },
    ]);
    const response = await request("PUT", "/selection", {
      goals: [
        { goalId: "g1", exerciseIds: ["e1"] },
        { goalId: "g2", exerciseIds: ["e2"] },
      ],
    });
    expect(response.status).toBe(200);
    expect(prisma.scheduledExercise.updateMany).toHaveBeenCalledTimes(1);
    expect(
      prisma.scheduledExercise.updateMany.mock.invocationCallOrder[0],
    ).toBeGreaterThan(
      prisma.dogExercise.createMany.mock.invocationCallOrder[1],
    );
  });

  it("replaces a discipline selection atomically while preserving retained completion", async () => {
    const body = { goals: [{ goalId: "g1", exerciseIds: ["e1"] }] };
    for (let i = 0; i < 2; i++) {
      const response = await request("PUT", "/selection", body);
      expect(response.status).toBe(200);
      expect((await response.json()).goals[0].completedAt).toBe(
        completedAt.toISOString(),
      );
    }
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
    expect(prisma.dogGoal.deleteMany).toHaveBeenCalledWith({
      where: {
        dogId: "dog-a",
        goal: { disciplineId: "d1" },
        goalId: { notIn: ["g1"] },
      },
    });
    expect(prisma.dogGoal.upsert).toHaveBeenCalledWith({
      where: { dogId_goalId: { dogId: "dog-a", goalId: "g1" } },
      create: { dogId: "dog-a", goalId: "g1" },
      update: {},
    });
    expect(prisma.dogExercise.deleteMany).toHaveBeenCalledWith({
      where: { dogId: "dog-a", goalId: "g1", exerciseId: { notIn: ["e1"] } },
    });
  });

  it("clears only this discipline when goals is empty", async () => {
    expect((await request("PUT", "/selection", { goals: [] })).status).toBe(
      200,
    );
    expect(prisma.dogGoal.deleteMany).toHaveBeenCalledWith({
      where: {
        dogId: "dog-a",
        goal: { disciplineId: "d1" },
        goalId: { notIn: [] },
      },
    });
    expect(prisma.dogGoal.upsert).not.toHaveBeenCalled();
  });

  it("allows a selected goal without exercises", async () => {
    expect(
      (await request("PUT", "/goals/g1", { exerciseIds: [] })).status,
    ).toBe(200);
    expect(prisma.dogExercise.deleteMany).toHaveBeenCalledWith({
      where: { dogId: "dog-a", goalId: "g1", exerciseId: { notIn: [] } },
    });
    expect(prisma.dogExercise.createMany).not.toHaveBeenCalled();
  });

  it("adds an individual goal and rejects an existing assignment", async () => {
    expect(
      (await request("POST", "/goals", { goalId: "g1", exerciseIds: [] }))
        .status,
    ).toBe(409);
    prisma.dogGoal.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValue(assignment);
    expect(
      (await request("POST", "/goals", { goalId: "g1", exerciseIds: [] }))
        .status,
    ).toBe(201);
  });

  it.each([
    "/goals",
    "/goals/g1",
    "/goals/g1/exercises",
    "/goals/g1/exercises/e1",
  ])("reads assignments at %s", async (path) => {
    expect((await request("GET", path)).status).toBe(200);
  });

  it("preserves the original completion date and can reopen a goal", async () => {
    expect(
      (await request("PATCH", "/goals/g1", { completed: true })).status,
    ).toBe(200);
    expect(prisma.dogGoal.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { completedAt } }),
    );
    expect(
      (await request("PATCH", "/goals/g1", { completed: false })).status,
    ).toBe(200);
    expect(prisma.dogGoal.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { completedAt: null } }),
    );
  });

  it("deletes an individual goal assignment within the requested discipline", async () => {
    expect((await request("DELETE", "/goals/g1")).status).toBe(204);
    expect(prisma.dogGoal.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { dogId: "dog-a", goal: { disciplineId: "d1" }, goalId: "g1" },
      }),
    );
    expect(prisma.dogGoal.delete).toHaveBeenCalledWith({
      where: { dogId_goalId: { dogId: "dog-a", goalId: "g1" } },
    });
  });

  it("adds and removes individual exercises without removing the goal", async () => {
    expect(
      (await request("POST", "/goals/g1/exercises", { exerciseId: "e1" }))
        .status,
    ).toBe(201);
    expect(prisma.dogExercise.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { dogId: "dog-a", goalId: "g1", exerciseId: "e1" },
        update: {},
      }),
    );
    expect((await request("DELETE", "/goals/g1/exercises/e1")).status).toBe(
      204,
    );
    expect(prisma.dogExercise.delete).toHaveBeenCalledWith({
      where: { dogId_exerciseId: { dogId: "dog-a", exerciseId: "e1" } },
    });
    expect(prisma.dogGoal.delete).not.toHaveBeenCalled();
  });

  it("does not add an exercise until its goal is assigned", async () => {
    prisma.dogGoal.findFirst.mockResolvedValue(null);
    expect(
      (await request("POST", "/goals/g1/exercises", { exerciseId: "e1" }))
        .status,
    ).toBe(404);
    expect(prisma.dogExercise.upsert).not.toHaveBeenCalled();
  });

  it("returns 404 for unassigned exercises", async () => {
    expect(
      (await request("DELETE", "/goals/g1/exercises/missing")).status,
    ).toBe(404);
    expect(prisma.dogExercise.delete).not.toHaveBeenCalled();
  });

  it("retries serialization conflicts and reports persistent contention", async () => {
    prisma.$transaction.mockRejectedValueOnce({ code: "P2034" });
    expect((await request("PUT", "/selection", { goals: [] })).status).toBe(
      200,
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    prisma.$transaction.mockRejectedValue({ code: "P2034" });
    expect((await request("PUT", "/selection", { goals: [] })).status).toBe(
      409,
    );
  });
});
