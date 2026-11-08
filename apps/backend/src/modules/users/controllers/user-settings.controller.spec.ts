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
import { UserSettingsService } from "@/modules/users/services/user-settings.service";
import { getSessionFromRequest } from "@/shared/auth/utils/get-session-from-request";
import { UserSettingsController } from "./user-settings.controller";

vi.mock("@/shared/auth/providers/better-auth.provider", async () => {
  const { Inject } = await import("@nestjs/common");
  return { InjectBetterAuth: Inject("BetterAuth") };
});
vi.mock("@/shared/auth/utils/get-session-from-request", () => ({
  getSessionFromRequest: vi.fn(),
}));

describe("user settings API", () => {
  let app: INestApplication;
  let url: string;
  const prisma = {
    user: { findUnique: vi.fn(), updateManyAndReturn: vi.fn() },
  };
  const getSession = vi.mocked(getSessionFromRequest);

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserSettingsController],
      providers: [
        UserSettingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: "BetterAuth", useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.listen(0, "127.0.0.1");
    url = `${await app.getUrl()}/users/me/settings`;
  });
  afterAll(async () => {
    await app?.close();
  });
  beforeEach(() => {
    vi.resetAllMocks();
    getSession.mockResolvedValue({
      user: { id: "owner", emailVerified: true, role: "user" },
    } as NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>);
    prisma.user.findUnique.mockResolvedValue({
      emailNotificationsEnabled: true,
    });
    prisma.user.updateManyAndReturn.mockImplementation(({ data }) =>
      Promise.resolve([data]),
    );
  });
  function update(body: unknown) {
    return fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("reads only the current user's preference", async () => {
    const response = await fetch(`${url}?userId=someone-else`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ emailNotificationsEnabled: true });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "owner" },
      select: { emailNotificationsEnabled: true },
    });
  });
  it.each([false, true])(
    "saves %s for the session user",
    async (emailNotificationsEnabled) => {
      const response = await update({ emailNotificationsEnabled });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ emailNotificationsEnabled });
      expect(prisma.user.updateManyAndReturn).toHaveBeenCalledWith({
        where: { id: "owner" },
        data: { emailNotificationsEnabled },
        select: { emailNotificationsEnabled: true },
      });
    },
  );
  it.each([
    {},
    { emailNotificationsEnabled: "false" },
    { emailNotificationsEnabled: null },
    { emailNotificationsEnabled: 0 },
    { emailNotificationsEnabled: false, userId: "other" },
    { emailNotificationsEnabled: false, role: "admin" },
  ])("rejects invalid or unauthorized fields: %o", async (body) => {
    expect((await update(body)).status).toBe(400);
    expect(prisma.user.updateManyAndReturn).not.toHaveBeenCalled();
  });
  it("requires a verified session for reads and writes", async () => {
    getSession.mockResolvedValue(null);
    expect((await fetch(url)).status).toBe(401);
    expect((await update({ emailNotificationsEnabled: false })).status).toBe(
      401,
    );
    getSession.mockResolvedValue({
      user: { id: "owner", emailVerified: false },
    } as NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>);
    expect((await update({ emailNotificationsEnabled: false })).status).toBe(
      403,
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.updateManyAndReturn).not.toHaveBeenCalled();
  });
});
