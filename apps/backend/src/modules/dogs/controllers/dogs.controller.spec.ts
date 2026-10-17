import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "@/core/prisma/prisma.service";
import { getSessionFromRequest } from "@/shared/auth/utils/get-session-from-request";
import { DogsController } from "./dogs.controller";

jest.mock("@/shared/auth/providers/better-auth.provider", () => ({
  InjectBetterAuth: require("@nestjs/common").Inject("BetterAuth"),
}));
jest.mock("@/shared/auth/utils/get-session-from-request", () => ({
  getSessionFromRequest: jest.fn(),
}));

describe("/api/dogs", () => {
  let app: INestApplication;
  let url: string;
  const getSession = jest.mocked(getSessionFromRequest);
  const findMany = jest.fn();
  const create = jest.fn();
  const updateManyAndReturn = jest.fn();
  const deleteMany = jest.fn();
  const initialDogs = [
    { id: "dog-a", text: "First dog", userId: "user-a" },
    { id: "dog-b", text: "Second dog", userId: "user-b" },
  ];
  let dogs = initialDogs.map((dog) => ({ ...dog }));

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [DogsController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            dog: { findMany, create, updateManyAndReturn, deleteMany },
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
    jest.resetAllMocks();
    dogs = initialDogs.map((dog) => ({ ...dog }));
    findMany.mockImplementation(({ where }: { where: { userId: string } }) =>
      Promise.resolve(dogs.filter((dog) => dog.userId === where.userId)),
    );
    create.mockImplementation(
      ({ data }: { data: { text: string; userId: string } }) => {
        const dog = { id: "dog-new", ...data };
        dogs.push(dog);
        return Promise.resolve(dog);
      },
    );
    updateManyAndReturn.mockImplementation(
      ({
        where,
        data,
      }: {
        where: { id: string; userId: string };
        data: { text: string };
      }) => {
        const matches = dogs.filter(
          (dog) => dog.id === where.id && dog.userId === where.userId,
        );
        matches.forEach((dog) => {
          dog.text = data.text;
        });
        return Promise.resolve(matches);
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
      user: { id: userId, role: "user" },
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
      expect(findMany).toHaveBeenCalledWith({ where: { userId } });
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
        { text: "Buddy" },
      );

      expect(response.status).toBe(401);
      expect(create).not.toHaveBeenCalled();
      expect(updateManyAndReturn).not.toHaveBeenCalled();
      expect(deleteMany).not.toHaveBeenCalled();
    },
  );

  it("creates a dog owned by the signed-in user", async () => {
    signIn("user-a");

    const response = await request("POST", "", { text: "Buddy" });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: "dog-new",
      text: "Buddy",
      userId: "user-a",
    });
    expect(create).toHaveBeenCalledWith({
      data: { text: "Buddy", userId: "user-a" },
    });
  });

  it("updates an owned dog and returns it", async () => {
    signIn("user-a");

    const response = await request("PATCH", "/dog-a", { text: "Buddy" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: "dog-a",
      text: "Buddy",
      userId: "user-a",
    });
    expect(updateManyAndReturn).toHaveBeenCalledWith({
      where: { id: "dog-a", userId: "user-a" },
      data: { text: "Buddy" },
    });
    expect(dogs[1]).toEqual(initialDogs[1]);
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
      method === "PATCH" ? { text: "Changed" } : undefined,
    );

    expect(response.status).toBe(404);
    expect(dogs).toEqual(initialDogs);
  });

  describe.each(["POST", "PATCH"])("%s body validation", (method) => {
    it.each([
      {},
      { text: "" },
      { text: " \n\t " },
      { text: null },
      { text: 123 },
      { text: "Buddy", userId: "user-b" },
      { text: "Buddy", id: "dog-b" },
      { text: "Buddy", user: { connect: { id: "user-b" } } },
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
});
