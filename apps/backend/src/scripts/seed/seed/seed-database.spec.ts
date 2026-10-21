import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { PrismaService } from "@/core/prisma/prisma.service";
import { User } from "@/generated/prisma/client";
import { BetterAuth } from "@/shared/auth/providers/better-auth.provider";
import { Config } from "@/shared/config/config.service";
import { createUser } from "./create-user";
import { seedDatabase } from "./seed-database";

vi.mock("./create-user", () => ({ createUser: vi.fn() }));
vi.mock("./seed-disciplines", () => ({ seedDisciplines: vi.fn() }));

describe("seedDatabase dog ownership", () => {
  const config = mockDeep<Config>();
  const auth = mockDeep<BetterAuth>();

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("adds dogs after creating users in an empty database", async () => {
    const prisma = mockDeep<PrismaService>();
    prisma.user.count.mockResolvedValue(0);
    prisma.user.findMany.mockResolvedValue([
      mockDeep<User>({ id: "admin", name: "Admin" }),
      mockDeep<User>({ id: "example-user", name: "Example User" }),
    ]);

    await seedDatabase(prisma, config, auth);

    expect(createUser).toHaveBeenCalledTimes(6);
    expect(prisma.dog.createMany).toHaveBeenCalledWith({
      data: [
        { userId: "admin", text: "Admin's dog" },
        { userId: "example-user", text: "Example User's dog" },
      ],
    });
  });

  it("adds dogs for existing users who have none without resetting data", async () => {
    const prisma = mockDeep<PrismaService>();
    prisma.user.count.mockResolvedValue(3);
    prisma.user.findMany.mockResolvedValue([
      mockDeep<User>({ id: "owner-without-dog", name: "Owner" }),
    ]);

    await seedDatabase(prisma, config, auth);

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { dogs: { none: {} } },
      select: { id: true, name: true },
    });
    expect(prisma.dog.createMany).toHaveBeenCalledWith({
      data: [{ userId: "owner-without-dog", text: "Owner's dog" }],
    });
    expect(createUser).not.toHaveBeenCalled();
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  it("does not add more dogs when every user already has one", async () => {
    const prisma = mockDeep<PrismaService>();
    prisma.user.count.mockResolvedValue(3);
    prisma.user.findMany.mockResolvedValue([]);

    await seedDatabase(prisma, config, auth);
    await seedDatabase(prisma, config, auth);

    expect(prisma.dog.createMany).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });
});
