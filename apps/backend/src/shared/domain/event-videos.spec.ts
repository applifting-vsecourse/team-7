import { describe, expect, it } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { PrismaService } from "@/core/prisma/prisma.service";
import { withEventFlags } from "./event-videos";

describe("event flags", () => {
  it("flags trainings with a watchable or processing video of the owner's dog", async () => {
    const prisma = mockDeep<PrismaService>();
    prisma.dogExercise.findMany.mockResolvedValue([]);
    prisma.video.findMany.mockResolvedValue([
      { sessionId: "1", dogId: "dog-a" },
      // A video no longer attached to the session's dog doesn't count.
      { sessionId: "2", dogId: null },
    ] as never);
    const events = [
      { id: "1", dogId: "dog-a", exerciseId: "e1" },
      { id: "2", dogId: "dog-a", exerciseId: "e1" },
    ];
    expect(await withEventFlags(prisma, "user-a", events)).toEqual([
      { ...events[0], paused: false, hasVideo: true },
      { ...events[1], paused: false, hasVideo: false },
    ]);
    expect(prisma.video.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user-a",
        sessionId: { in: ["1", "2"] },
        status: { notIn: ["failed", "deleting"] },
      },
      select: { sessionId: true, dogId: true },
    });
  });

  it("skips the video query when there are no trainings", async () => {
    const prisma = mockDeep<PrismaService>();
    expect(await withEventFlags(prisma, "user-a", [])).toEqual([]);
    expect(prisma.video.findMany).not.toHaveBeenCalled();
  });
});
