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

describe("GET /api/dogs", () => {
  let app: INestApplication;
  let url: string;
  const getSession = jest.mocked(getSessionFromRequest);
  const findMany = jest.fn();
  const dogs = [
    { id: "dog-a", text: "First dog", userId: "user-a" },
    { id: "dog-b", text: "Second dog", userId: "user-b" },
  ];

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [DogsController],
      providers: [
        { provide: PrismaService, useValue: { dog: { findMany } } },
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
    findMany.mockImplementation(({ where }: { where: { userId: string } }) =>
      Promise.resolve(dogs.filter((dog) => dog.userId === where.userId)),
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
});
