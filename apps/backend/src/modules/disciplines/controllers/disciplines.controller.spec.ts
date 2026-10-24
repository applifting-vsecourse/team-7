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
import { getSessionFromRequest } from "@/shared/auth/utils/get-session-from-request";
import { DisciplinesController } from "./disciplines.controller";
import { ExercisesController } from "./exercises.controller";
import { GoalsController } from "./goals.controller";

vi.mock("@/shared/auth/providers/better-auth.provider", async () => {
  const { Inject } = await import("@nestjs/common");
  return { InjectBetterAuth: Inject("BetterAuth") };
});
vi.mock("@/shared/auth/utils/get-session-from-request", () => ({
  getSessionFromRequest: vi.fn(),
}));

describe("discipline library API", () => {
  let app: INestApplication;
  let url: string;
  const getSession = vi.mocked(getSessionFromRequest);
  const prisma = {
    discipline: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateManyAndReturn: vi.fn(),
      deleteMany: vi.fn(),
    },
    goal: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateManyAndReturn: vi.fn(),
      deleteMany: vi.fn(),
    },
    exercise: {
      create: vi.fn(),
      updateManyAndReturn: vi.fn(),
      deleteMany: vi.fn(),
    },
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [
        DisciplinesController,
        GoalsController,
        ExercisesController,
      ],
      providers: [
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
      user: { id: "user-a", role: "user" },
    } as NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>);
  });

  afterAll(async () => {
    await app?.close();
  });

  function request(method: string, path: string, body?: unknown) {
    return fetch(`${url}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  it("rejects unauthenticated requests without querying", async () => {
    getSession.mockResolvedValue(null);

    const response = await request("GET", "/disciplines");

    expect(response.status).toBe(401);
    expect(prisma.discipline.findMany).not.toHaveBeenCalled();
  });

  it("lists the user's disciplines with counts and distinct dogs", async () => {
    const dog = { id: "dog-a", name: "Mája" };
    prisma.discipline.findMany.mockResolvedValue([
      {
        id: "d1",
        name: "Poslušnost",
        description: null,
        goals: [
          { _count: { exercises: 2 }, dogs: [{ dog }] },
          { _count: { exercises: 3 }, dogs: [{ dog }] },
        ],
      },
    ]);

    const response = await request("GET", "/disciplines?userId=user-b");

    expect(await response.json()).toEqual([
      {
        id: "d1",
        name: "Poslušnost",
        description: null,
        goalCount: 2,
        exerciseCount: 5,
        dogs: [dog],
      },
    ]);
    expect(prisma.discipline.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-a" } }),
    );
  });

  it("creates a discipline for the session user with trimmed text", async () => {
    prisma.discipline.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: "d1", ...data }),
    );

    const response = await request("POST", "/disciplines", {
      name: "  Agility ",
      description: "   ",
    });

    expect(response.status).toBe(201);
    expect(prisma.discipline.create).toHaveBeenCalledWith({
      data: { name: "Agility", description: null, userId: "user-a" },
    });
  });

  it.each([
    { name: "   " },
    { name: "x".repeat(101) },
    { name: "Agility", userId: "user-b" },
  ])("rejects invalid discipline input %o", async (body) => {
    const response = await request("POST", "/disciplines", body);

    expect(response.status).toBe(400);
    expect(prisma.discipline.create).not.toHaveBeenCalled();
  });

  it("aggregates per-dog goal progress in the detail", async () => {
    const dog = { id: "dog-a", name: "Mája" };
    prisma.discipline.findFirst.mockResolvedValue({
      id: "d1",
      name: "Poslušnost",
      description: null,
      goals: [
        {
          id: "g1",
          name: "Přivolání",
          criterion: null,
          exercises: [
            { id: "e1", name: "Z 5 m", procedure: null, _count: { dogs: 1 } },
          ],
          dogs: [{ dog, completedAt: new Date(), _count: { exercises: 1 } }],
        },
        {
          id: "g2",
          name: "Chůze u nohy",
          criterion: null,
          exercises: [],
          dogs: [{ dog, completedAt: null, _count: { exercises: 0 } }],
        },
      ],
    });

    const response = await request("GET", "/disciplines/d1");
    const detail = await response.json();

    expect(detail.dogs).toEqual([
      { ...dog, goalCount: 2, completedGoalCount: 1, exerciseCount: 1 },
    ]);
    expect(detail.goals[0].exercises).toEqual([
      { id: "e1", name: "Z 5 m", procedure: null, dogCount: 1 },
    ]);
  });

  it("returns 404 for a discipline the user does not own", async () => {
    prisma.discipline.findFirst.mockResolvedValue(null);

    const response = await request("GET", "/disciplines/foreign");

    expect(response.status).toBe(404);
    expect(prisma.discipline.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "foreign", userId: "user-a" } }),
    );
  });

  it("does not add a goal to another user's discipline", async () => {
    prisma.discipline.findFirst.mockResolvedValue(null);

    const response = await request("POST", "/disciplines/foreign/goals", {
      name: "Slalom",
    });

    expect(response.status).toBe(404);
    expect(prisma.goal.create).not.toHaveBeenCalled();
  });

  it("scopes goal and exercise writes to the owner", async () => {
    prisma.goal.updateManyAndReturn.mockResolvedValue([]);
    prisma.exercise.deleteMany.mockResolvedValue({ count: 0 });

    const goal = await request("PATCH", "/goals/g1", { name: "Slalom" });
    const exercise = await request("DELETE", "/exercises/e1");

    expect(goal.status).toBe(404);
    expect(prisma.goal.updateManyAndReturn).toHaveBeenCalledWith({
      where: { id: "g1", discipline: { userId: "user-a" } },
      data: { name: "Slalom", criterion: null },
    });
    expect(exercise.status).toBe(404);
    expect(prisma.exercise.deleteMany).toHaveBeenCalledWith({
      where: { id: "e1", goal: { discipline: { userId: "user-a" } } },
    });
  });

  it("adds an exercise to an owned goal", async () => {
    prisma.goal.findFirst.mockResolvedValue({ id: "g1" });
    prisma.exercise.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: "e1", ...data }),
    );

    const response = await request("POST", "/goals/g1/exercises", {
      name: "Přivolání od hračky",
      procedure: "5 opakování",
    });

    expect(response.status).toBe(201);
    expect(prisma.exercise.create).toHaveBeenCalledWith({
      data: {
        name: "Přivolání od hračky",
        procedure: "5 opakování",
        goalId: "g1",
      },
    });
  });
});
