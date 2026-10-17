import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaService } from "@/core/prisma/prisma.service";
import { DogAvatarsController } from "@/modules/dogs/avatars/avatars.controller";
import { DogAvatarsService } from "@/modules/dogs/avatars/avatars.service";
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
  const findFirst = jest.fn();
  const create = jest.fn();
  const updateManyAndReturn = jest.fn();
  const deleteMany = jest.fn();
  const initialDogs = [
    { id: "dog-a", text: "First dog", userId: "user-a" },
    { id: "dog-b", text: "Second dog", userId: "user-b" },
  ];
  let dogs: Array<{
    id: string;
    text: string;
    userId: string;
    avatar?: Uint8Array | null;
    avatarVersion?: string | null;
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
    jest.resetAllMocks();
    dogs = initialDogs.map((dog) => ({ ...dog }));
    findMany.mockImplementation(({ where }: { where: { userId: string } }) =>
      Promise.resolve(
        dogs.filter((dog) => dog.userId === where.userId).map(withoutAvatar),
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
      ({ data }: { data: { text: string; userId: string } }) => {
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
      expect(findMany).toHaveBeenCalledWith({
        where: { userId },
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
      omit: { avatar: true },
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
      omit: { avatar: true },
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
      if (method === "POST") body.set("text", "Buddy");
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
