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
import { CatalogController } from "./catalog.controller";

vi.mock("@/shared/auth/providers/better-auth.provider", async () => {
  const { Inject } = await import("@nestjs/common");
  return { InjectBetterAuth: Inject("BetterAuth") };
});
vi.mock("@/shared/auth/utils/get-session-from-request", () => ({
  getSessionFromRequest: vi.fn(),
}));

describe("/api/catalog", () => {
  let app: INestApplication;
  let url: string;
  const getSession = vi.mocked(getSessionFromRequest);
  const prisma = { discipline: { findUnique: vi.fn(), create: vi.fn() } };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: "BetterAuth", useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    await app.listen(0, "127.0.0.1");
    url = `${await app.getUrl()}/api/catalog`;
  });

  beforeEach(() => {
    vi.resetAllMocks();
    getSession.mockResolvedValue({
      user: { id: "user-a", role: "user", emailVerified: true },
    } as NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>);
  });

  afterAll(async () => {
    await app?.close();
  });

  const copy = (key: string, body: unknown = { lng: "en" }) =>
    fetch(`${url}/${key}/copy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  describe("GET", () => {
    it("is public and Czech by default", async () => {
      getSession.mockResolvedValue(null);

      const response = await fetch(url);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.categories).toHaveLength(5);
      expect(body.categories[0]).toMatchObject({
        key: "everyday",
        name: "Výchova a každodenní život",
      });
      expect(body.categories[0].disciplines[0]).toMatchObject({
        key: "obedience",
        name: "Základy poslušnosti",
      });
    });

    it("returns English for lng=en", async () => {
      const body = await (await fetch(`${url}?lng=en`)).json();

      expect(body.categories[0].disciplines[0].name).toBe("Obedience basics");
    });

    it("rejects an unsupported language", async () => {
      expect((await fetch(`${url}?lng=de`)).status).toBe(400);
    });
  });

  describe("POST /:key/copy", () => {
    it("requires a signed-in user", async () => {
      getSession.mockResolvedValue(null);

      expect((await copy("obedience")).status).toBe(401);
      expect(prisma.discipline.create).not.toHaveBeenCalled();
    });

    it("copies the discipline with goals and ordered exercises", async () => {
      prisma.discipline.findUnique.mockResolvedValue(null);
      prisma.discipline.create.mockResolvedValue({ id: "d1" });

      const response = await copy("nosework");

      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({ id: "d1", created: true });
      expect(prisma.discipline.findUnique).toHaveBeenCalledWith({
        where: {
          userId_catalogKey: { userId: "user-a", catalogKey: "nosework" },
        },
        select: { id: true },
      });
      const { data } = prisma.discipline.create.mock.calls[0]![0];
      expect(data).toMatchObject({
        userId: "user-a",
        category: "scent",
        catalogKey: "nosework",
        name: expect.any(String),
        description: expect.any(String),
      });
      expect(data.goals.create).toHaveLength(3);
      const goal = data.goals.create[0];
      expect(goal.criterion).toEqual(expect.any(String));
      expect(goal.exercises.create[1]).toMatchObject({
        position: 1,
        procedure: expect.any(String),
      });
    });

    it("returns the existing copy instead of a second one", async () => {
      prisma.discipline.findUnique.mockResolvedValue({ id: "d0" });

      const response = await copy("nosework");

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ id: "d0", created: false });
      expect(prisma.discipline.create).not.toHaveBeenCalled();
    });

    it("returns the parallel request's copy on a unique violation", async () => {
      prisma.discipline.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "d2" });
      prisma.discipline.create.mockRejectedValue({ code: "P2002" });

      const response = await copy("nosework");

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ id: "d2", created: false });
    });

    it("returns 404 for an unknown key", async () => {
      expect((await copy("unknown")).status).toBe(404);
      expect(prisma.discipline.create).not.toHaveBeenCalled();
    });

    it("rejects an unsupported language", async () => {
      expect((await copy("nosework", { lng: "de" })).status).toBe(400);
    });
  });
});
