import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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
import { DogAvatarsController } from "@/modules/dogs/avatars/avatars.controller";
import { DogAvatarsService } from "@/modules/dogs/avatars/avatars.service";
import { getSessionFromRequest } from "@/shared/auth/utils/get-session-from-request";
import { DogsController } from "./dogs.controller";

vi.mock("@/shared/auth/providers/better-auth.provider", async () => {
  const { Inject } = await import("@nestjs/common");
  return { InjectBetterAuth: Inject("BetterAuth") };
});
vi.mock("@/shared/auth/utils/get-session-from-request", () => ({
  getSessionFromRequest: vi.fn(),
}));

describe("/api/dogs", () => {
  let app: INestApplication;
  let url: string;
  const getSession = vi.mocked(getSessionFromRequest);
  const findMany = vi.fn();
  const findFirst = vi.fn();
  const groupBy = vi.fn();
  const findExercises = vi.fn();
  const create = vi.fn();
  const updateManyAndReturn = vi.fn();
  const deleteMany = vi.fn();
  const initialDogs = [
    { id: "dog-a", name: "First dog", userId: "user-a" },
    { id: "dog-b", name: "Second dog", userId: "user-b" },
  ];
  let dogs: Array<{
    id: string;
    name: string;
    userId: string;
    avatar?: Uint8Array | null;
    avatarVersion?: string | null;
    archivedAt?: Date | null;
  }> = initialDogs.map((dog) => ({ ...dog }));
  const withoutAvatar = ({ avatar: _avatar, ...dog }: (typeof dogs)[number]) =>
    dog;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [DogsController, DogAvatarsController],
      providers: [
        DogAvatarsService,
        {
          provide: PrismaService,
          useValue: {
            scheduledExercise: { groupBy },
            exercise: { findMany: findExercises },
            dog: {
              findMany,
              findFirst,
              create,
              updateManyAndReturn,
              deleteMany,
            },
          },
        },
        { provide: "BetterAuth", useValue: {} },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    await app.listen(0, "127.0.0.1");
    url = `${await app.getUrl()}/api/dogs`;
  });

  beforeEach(() => {
    vi.resetAllMocks();
    groupBy.mockResolvedValue([]);
    findExercises.mockResolvedValue([]);
    dogs = initialDogs.map((dog) => ({ ...dog }));
    findMany.mockImplementation(
      ({ where }: { where: { userId: string; archivedAt?: null } }) =>
        Promise.resolve(
          dogs
            .filter((dog) => dog.userId === where.userId && !dog.archivedAt)
            .map(withoutAvatar),
        ),
    );
    findFirst.mockImplementation(
      ({ where }: { where: { id: string; userId: string } }) =>
        Promise.resolve(
          dogs.find(
            (dog) => dog.id === where.id && dog.userId === where.userId,
          ) ?? null,
        ),
    );
    create.mockImplementation(
      ({ data }: { data: { name: string; userId: string } }) => {
        const dog = { id: "dog-new", ...data };
        dogs.push(dog);
        return Promise.resolve(withoutAvatar(dog));
      },
    );
    updateManyAndReturn.mockImplementation(
      ({
        where,
        data,
      }: {
        where: { id: string; userId: string };
        data: Partial<(typeof dogs)[number]>;
      }) => {
        const matches = dogs.filter(
          (dog) => dog.id === where.id && dog.userId === where.userId,
        );
        matches.forEach((dog) => {
          Object.assign(dog, data);
        });
        return Promise.resolve(matches.map(withoutAvatar));
      },
    );
    deleteMany.mockImplementation(
      ({ where }: { where: { id: string; userId: string } }) => {
        const previousCount = dogs.length;
        dogs = dogs.filter(
          (dog) => dog.id !== where.id || dog.userId !== where.userId,
        );
        return Promise.resolve({ count: previousCount - dogs.length });
      },
    );
  });

  afterAll(async () => {
    await app?.close();
  });

  function signIn(userId: string) {
    getSession.mockResolvedValue({
      user: { id: userId, role: "user", emailVerified: true },
    } as NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>);
  }

  function request(method: string, path = "", body?: unknown) {
    return fetch(`${url}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  it("rejects unauthenticated requests without querying dogs", async () => {
    getSession.mockResolvedValue(null);

    const response = await fetch(url);

    expect(response.status).toBe(401);
    expect(findMany).not.toHaveBeenCalled();
  });

  it.each(["user-a", "user-b"])(
    "returns only dogs owned by %s, ignoring a supplied owner ID",
    async (userId) => {
      signIn(userId);

      const response = await fetch(`${url}?userId=someone-else`);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(
        dogs.filter((dog) => dog.userId === userId),
      );
      expect(findMany).toHaveBeenCalledWith({
        where: { userId, archivedAt: null },
        omit: { avatar: true },
      });
    },
  );

  it("returns an empty list when the user owns no dogs", async () => {
    signIn("user-without-dogs");

    const response = await fetch(url);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it.each(["POST", "PATCH", "DELETE"])(
    "rejects unauthenticated %s requests without writing dogs",
    async (method) => {
      getSession.mockResolvedValue(null);

      const response = await request(
        method,
        method === "POST" ? "" : "/dog-a",
        { name: "Buddy" },
      );

      expect(response.status).toBe(401);
      expect(create).not.toHaveBeenCalled();
      expect(updateManyAndReturn).not.toHaveBeenCalled();
      expect(deleteMany).not.toHaveBeenCalled();
    },
  );

  it("creates a dog owned by the signed-in user", async () => {
    signIn("user-a");

    const response = await request("POST", "", { name: "Buddy" });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: "dog-new",
      name: "Buddy",
      userId: "user-a",
    });
    expect(create).toHaveBeenCalledWith({
      data: { name: "Buddy", userId: "user-a" },
      omit: { avatar: true },
    });
  });

  it("updates an owned dog and returns it", async () => {
    signIn("user-a");

    const response = await request("PATCH", "/dog-a", { name: "Buddy" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: "dog-a",
      name: "Buddy",
      userId: "user-a",
    });
    expect(updateManyAndReturn).toHaveBeenCalledWith({
      where: { id: "dog-a", userId: "user-a" },
      data: { name: "Buddy" },
      omit: { avatar: true },
    });
    expect(dogs[1]).toEqual(initialDogs[1]);
  });

  it("stores breed and birth date, trimming the name and clearing a blank breed", async () => {
    signIn("user-a");

    await request("POST", "", {
      name: "  Bára ",
      breed: "Border kolie",
      birthDate: "2022-05-03",
    });
    await request("POST", "", { name: "Rex", breed: "  " });

    expect(create).toHaveBeenNthCalledWith(1, {
      data: {
        name: "Bára",
        breed: "Border kolie",
        birthDate: new Date("2022-05-03"),
        userId: "user-a",
      },
      omit: { avatar: true },
    });
    expect(create).toHaveBeenNthCalledWith(2, {
      data: { name: "Rex", breed: null, userId: "user-a" },
      omit: { avatar: true },
    });
  });

  it("accepts breed and birth date alongside a photo in a multipart create", async () => {
    signIn("user-a");
    const body = new FormData();
    body.set("name", "Bára");
    body.set("breed", "Border kolie");
    body.set("birthDate", "2022-05-03");

    const response = await fetch(url, { method: "POST", body });

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith({
      data: {
        name: "Bára",
        breed: "Border kolie",
        birthDate: new Date("2022-05-03"),
        userId: "user-a",
      },
      omit: { avatar: true },
    });
  });

  it("leaves omitted optional fields unchanged on update and clears null ones", async () => {
    signIn("user-a");

    await request("PATCH", "/dog-a", { name: "Buddy" });
    await request("PATCH", "/dog-a", { name: "Buddy", birthDate: null });

    expect(updateManyAndReturn).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ data: { name: "Buddy" } }),
    );
    expect(updateManyAndReturn).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ data: { name: "Buddy", birthDate: null } }),
    );
  });

  it("deletes an owned dog and returns no content", async () => {
    signIn("user-a");

    const response = await request("DELETE", "/dog-a");

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(deleteMany).toHaveBeenCalledWith({
      where: { id: "dog-a", userId: "user-a" },
    });
    expect(dogs).toEqual([initialDogs[1]]);
  });

  it.each([
    ["PATCH", "dog-b"],
    ["DELETE", "dog-b"],
    ["PATCH", "missing-dog"],
    ["DELETE", "missing-dog"],
  ])("returns 404 for %s on unowned or missing dog %s", async (method, id) => {
    signIn("user-a");

    const response = await request(
      method,
      `/${id}`,
      method === "PATCH" ? { name: "Changed" } : undefined,
    );

    expect(response.status).toBe(404);
    expect(dogs).toEqual(initialDogs);
  });

  it("archives only an owned dog and hides it from the list without deleting it", async () => {
    signIn("user-a");
    expect((await request("POST", "/dog-b/archive")).status).toBe(404);
    expect((await request("POST", "/dog-a/archive")).status).toBe(201);
    expect(dogs[0].archivedAt).toBeInstanceOf(Date);
    expect(dogs).toHaveLength(2);
    expect(await (await fetch(url)).json()).toEqual([]);
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("returns owned discipline progress without confusing library goals with selected goals", async () => {
    signIn("user-a");
    const recent = new Date(Date.now() - 1000);
    const ratedAt = new Date(Date.now() - 2 * 86400000);
    const old = new Date(Date.now() - 40 * 86400000);
    findFirst.mockResolvedValueOnce({
      ...initialDogs[0],
      disciplines: [
        { discipline: { id: "d1", name: "Obedience", description: null } },
        { discipline: { id: "d2", name: "New", description: null } },
      ],
      goals: [
        {
          goal: { disciplineId: "d1" },
          completedAt: new Date(),
          exercises: [{ exerciseId: "e1" }],
        },
        { goal: { disciplineId: "d1" }, completedAt: null, exercises: [] },
      ],
    });
    groupBy
      .mockResolvedValueOnce([
        { exerciseId: "e1", _sum: { rating: 8 }, _count: { rating: 2 } },
        { exerciseId: "e2", _sum: { rating: 3 }, _count: { rating: 1 } },
      ])
      .mockResolvedValueOnce([
        { exerciseId: "e2", _max: { completedAt: recent } },
        { exerciseId: "e1", _max: { completedAt: ratedAt } },
        { exerciseId: "e3", _max: { completedAt: old } },
      ]);
    findExercises.mockResolvedValue([
      { id: "e1", goal: { disciplineId: "d1" } },
      { id: "e2", goal: { disciplineId: "d1" } },
      { id: "e3", goal: { disciplineId: "d2" } },
    ]);
    const response = await fetch(`${url}/dog-a`);
    expect(response.status).toBe(200);
    const profile = await response.json();
    expect(profile).not.toHaveProperty("scheduledExercises");
    expect(profile.disciplines).toEqual([
      {
        id: "d1",
        name: "Obedience",
        description: null,
        averageRating: 11 / 3,
        lastTrainingAt: recent.toISOString(),
        exerciseTraining: [
          { exerciseId: "e2", lastTrainingAt: recent.toISOString() },
          { exerciseId: "e1", lastTrainingAt: ratedAt.toISOString() },
        ],
        goalCount: 2,
        completedGoalCount: 1,
        exerciseCount: 1,
      },
      {
        id: "d2",
        name: "New",
        description: null,
        averageRating: null,
        lastTrainingAt: old.toISOString(),
        exerciseTraining: [
          { exerciseId: "e3", lastTrainingAt: old.toISOString() },
        ],
        goalCount: 0,
        completedGoalCount: 0,
        exerciseCount: 0,
      },
    ]);
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "dog-a", userId: "user-a" } }),
    );
    expect(findFirst.mock.calls[0][0].include).not.toHaveProperty(
      "scheduledExercises",
    );
    const range = groupBy.mock.calls[0][0].where.completedAt;
    expect(range.lte.getTime() - range.gte.getTime()).toBe(30 * 86400000);
    expect(groupBy).toHaveBeenNthCalledWith(1, {
      by: ["exerciseId"],
      where: {
        dogId: "dog-a",
        deletedAt: null,
        completedAt: { gte: range.gte, lte: range.lte },
        exercise: { goal: { disciplineId: { in: ["d1", "d2"] } } },
      },
      _sum: { rating: true },
      _count: { rating: true },
    });
    expect(groupBy).toHaveBeenNthCalledWith(2, {
      by: ["exerciseId"],
      where: {
        dogId: "dog-a",
        deletedAt: null,
        completedAt: { not: null, lte: range.lte },
        exercise: { goal: { disciplineId: { in: ["d1", "d2"] } } },
      },
      _max: { completedAt: true },
    });
  });

  it("does not expose another owner's profile", async () => {
    signIn("user-a");
    expect((await fetch(`${url}/dog-b`)).status).toBe(404);
    expect(groupBy).not.toHaveBeenCalled();
    expect(findExercises).not.toHaveBeenCalled();
  });

  describe.each(["POST", "PATCH"])("%s body validation", (method) => {
    it.each([
      {},
      { name: "" },
      { name: " \n\t " },
      { name: null },
      { name: 123 },
      { name: "x".repeat(101) },
      { name: "Buddy", breed: "x".repeat(101) },
      { name: "Buddy", birthDate: "03.05.2022" },
      { name: "Buddy", birthDate: "2022-13-01" },
      { name: "Buddy", birthDate: "2022-05-03T10:00:00Z" },
      { name: "Buddy", birthDate: "2999-01-01" },
      { name: "Buddy", userId: "user-b" },
      { name: "Buddy", id: "dog-b" },
      { name: "Buddy", user: { connect: { id: "user-b" } } },
    ])("rejects invalid data %j without writing dogs", async (body) => {
      signIn("user-a");

      const response = await request(
        method,
        method === "POST" ? "" : "/dog-a",
        body,
      );

      expect(response.status).toBe(400);
      expect(create).not.toHaveBeenCalled();
      expect(updateManyAndReturn).not.toHaveBeenCalled();
      expect(dogs).toEqual(initialDogs);
    });
  });
  describe("avatars", () => {
    const fixtures = {
      png: readFileSync(join(__dirname, "../avatars/fixtures/avatar.png")),
      webp: readFileSync(join(__dirname, "../avatars/fixtures/avatar.webp")),
      jpeg: readFileSync(join(__dirname, "../avatars/fixtures/avatar.jpeg")),
    };
    async function upload(
      path = "/dog-a/avatar",
      bytes?: Uint8Array,
      method: "PUT" | "POST" = "PUT",
    ) {
      const body = new FormData();
      const image = bytes ?? new Uint8Array(fixtures.webp);
      body.set(
        "file",
        new Blob([image as Uint8Array<ArrayBuffer>], { type: "image/png" }),
        "photo.png",
      );
      if (method === "POST") body.set("name", "Buddy");
      return fetch(`${url}${path}`, { method, body });
    }

    it("stores the uploaded image unchanged and excludes bytes from responses and lists", async () => {
      signIn("user-a");
      const input = fixtures.png;
      const response = await upload(undefined, new Uint8Array(input));
      expect(response.status).toBe(200);
      const saved = await response.json();
      expect(saved.avatarVersion).toEqual(expect.any(String));
      expect(saved).not.toHaveProperty("avatar");
      const dog = dogs[0];
      expect(dog.avatar).toBeInstanceOf(Uint8Array);
      expect(Buffer.from(dog.avatar!)).toEqual(input);
      const avatarResponse = await fetch(`${url}/dog-a/avatar`);
      expect(avatarResponse.headers.get("content-type")).toBe("image/png");
      expect(Buffer.from(await avatarResponse.arrayBuffer())).toEqual(input);
      const list = await fetch(url);
      expect((await list.json())[0]).not.toHaveProperty("avatar");
    });

    it.each(["jpeg", "png", "webp"] as const)(
      "identifies %s from its signature despite the supplied PNG MIME type",
      async (format) => {
        signIn("user-a");
        const input = fixtures[format];
        expect((await upload(undefined, new Uint8Array(input))).status).toBe(
          200,
        );
        const response = await fetch(`${url}/dog-a/avatar`);
        expect(response.headers.get("content-type")).toBe(`image/${format}`);
        expect(Buffer.from(await response.arrayBuffer())).toEqual(input);
      },
    );

    it.each([
      '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"/>',
      "GIF89a",
      "<html>not an image</html>",
    ])(
      "rejects unsupported content disguised as a PNG: %s",
      async (content) => {
        signIn("user-a");
        expect(
          (await upload(undefined, new TextEncoder().encode(content))).status,
        ).toBe(400);
        expect(updateManyAndReturn).not.toHaveBeenCalled();
      },
    );

    it("creates a dog and its photo together", async () => {
      signIn("user-a");
      const response = await upload("", undefined, "POST");
      expect(response.status).toBe(201);
      expect(await response.json()).not.toHaveProperty("avatar");
      expect(dogs[dogs.length - 1]?.avatar).toBeInstanceOf(Uint8Array);
    });

    it("serves WebP bytes and revalidates the cache with an ETag", async () => {
      signIn("user-a");
      await upload();
      const response = await fetch(`${url}/dog-a/avatar`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("image/webp");
      expect(response.headers.get("cache-control")).toBe("private, no-cache");
      expect(Buffer.from(await response.arrayBuffer())).toEqual(
        Buffer.from(dogs[0].avatar!),
      );
      const cached = await fetch(`${url}/dog-a/avatar`, {
        headers: { "If-None-Match": response.headers.get("etag")! },
      });
      expect(cached.status).toBe(304);
      expect(await cached.text()).toBe("");
    });

    it("replaces and removes photos, invalidating the old version", async () => {
      signIn("user-a");
      await upload();
      const previous = dogs[0].avatarVersion;
      await upload();
      expect(dogs[0].avatarVersion).not.toBe(previous);
      const response = await fetch(`${url}/dog-a/avatar`, { method: "DELETE" });
      expect(response.status).toBe(200);
      expect(dogs[0].avatar).toBeNull();
      expect(dogs[0].avatarVersion).toBeNull();
      expect((await fetch(`${url}/dog-a/avatar`)).status).toBe(404);
    });

    it.each(["GET", "PUT", "DELETE"])(
      "requires authentication for %s",
      async (method) => {
        getSession.mockResolvedValue(null);
        const response =
          method === "PUT"
            ? await upload()
            : await fetch(`${url}/dog-a/avatar`, { method });
        expect(response.status).toBe(401);
        expect(findFirst).not.toHaveBeenCalled();
        expect(updateManyAndReturn).not.toHaveBeenCalled();
      },
    );

    it.each(["dog-b", "missing-dog"])(
      "prevents reading or modifying %s",
      async (id) => {
        signIn("user-a");
        expect((await upload(`/${id}/avatar`)).status).toBe(404);
        expect((await fetch(`${url}/${id}/avatar`)).status).toBe(404);
        expect(
          (await fetch(`${url}/${id}/avatar`, { method: "DELETE" })).status,
        ).toBe(404);
        expect(dogs).toEqual(initialDogs);
      },
    );

    it("rejects missing, corrupt and oversized uploads", async () => {
      signIn("user-a");
      expect(
        (
          await fetch(`${url}/dog-a/avatar`, {
            method: "PUT",
            body: new FormData(),
          })
        ).status,
      ).toBe(400);
      expect(
        (await upload(undefined, new TextEncoder().encode("not an image")))
          .status,
      ).toBe(400);
      expect(
        (await upload(undefined, new Uint8Array(100 * 1024 + 1))).status,
      ).toBe(413);
      expect(updateManyAndReturn).not.toHaveBeenCalled();
    });

    it("does not create a dog when the photo is invalid", async () => {
      signIn("user-a");
      expect((await upload("", new Uint8Array([1, 2, 3]), "POST")).status).toBe(
        400,
      );
      expect(create).not.toHaveBeenCalled();
    });
  });
});
