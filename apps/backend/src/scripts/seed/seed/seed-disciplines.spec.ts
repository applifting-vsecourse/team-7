import { describe, expect, it } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { PrismaService } from "@/core/prisma/prisma.service";
import { seedDisciplines } from "./seed-disciplines";

describe("seedDisciplines", () => {
  it("adds the sample library to users who only have the default disciplines", async () => {
    const prisma = mockDeep<PrismaService>();
    prisma.user.findMany.mockResolvedValue([]);

    await seedDisciplines(prisma);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { disciplines: { none: { name: "Poslušnost" } } },
      }),
    );
  });
});
