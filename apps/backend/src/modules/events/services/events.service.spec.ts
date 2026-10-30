import { BadRequestException, NotFoundException } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { PrismaService } from "@/core/prisma/prisma.service";
import { EventsService } from "./events.service";

describe("exercise scheduling", () => {
  const prisma = mockDeep<PrismaService>();
  const service = new EventsService(prisma);
  const input = {
    dogId: "dog-a",
    timeZone: "Europe/Prague",
    exercises: [
      {
        exerciseId: "exercise-a",
        startsAt: "2099-10-25T07:15:00.000Z",
        durationMinutes: 10,
      },
    ],
  };
  beforeEach(() => {
    vi.resetAllMocks();
    prisma.$transaction.mockImplementation(async (callback: unknown) =>
      (callback as (tx: unknown) => Promise<unknown>)(prisma),
    );
    prisma.dog.findFirst.mockResolvedValue({ id: "dog-a" } as never);
    prisma.dogExercise.count.mockResolvedValue(1);
    prisma.scheduledExercise.createMany.mockResolvedValue({ count: 1 });
  });
  it("checks ownership and saves the whole batch in a transaction", async () => {
    await expect(service.schedule("user-a", input)).resolves.toEqual({
      count: 1,
    });
    expect(prisma.dog.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "dog-a", userId: "user-a", archivedAt: null },
      }),
    );
    expect(prisma.dogExercise.count).toHaveBeenCalledWith({
      where: {
        dogId: "dog-a",
        exerciseId: { in: ["exercise-a"] },
        dogGoal: {
          completedAt: null,
          goal: { discipline: { userId: "user-a" } },
        },
      },
    });
    expect(prisma.scheduledExercise.createMany).toHaveBeenCalledWith({
      data: [
        {
          dogId: "dog-a",
          exerciseId: "exercise-a",
          startsAt: new Date(input.exercises[0]!.startsAt),
          durationMinutes: 10,
        },
      ],
    });
  });
  it("rejects another handler’s dog without writing", async () => {
    prisma.dog.findFirst.mockResolvedValue(null);
    await expect(service.schedule("user-b", input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.scheduledExercise.createMany).not.toHaveBeenCalled();
  });
  it("rejects the entire batch when an exercise is unassigned or completed", async () => {
    prisma.dogExercise.count.mockResolvedValue(0);
    await expect(service.schedule("user-a", input)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.scheduledExercise.createMany).not.toHaveBeenCalled();
  });
  it("rejects a past date in any row before saving the batch", async () => {
    await expect(
      service.schedule("user-a", {
        ...input,
        exercises: [
          ...input.exercises,
          { ...input.exercises[0]!, startsAt: "2000-01-01T08:00:00Z" },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it.each([
    { from: "2026-11-01T00:00:00Z", to: "2026-10-01T00:00:00Z" },
    { from: "2026-01-01T00:00:00Z", to: "2026-12-01T00:00:00Z" },
  ])("rejects invalid or unbounded calendar ranges", (range) => {
    expect(() => service.list("user-a", range)).toThrow(BadRequestException);
    expect(prisma.scheduledExercise.findMany).not.toHaveBeenCalled();
  });
  it("only lists the current handler’s active dogs", async () => {
    await service.list("user-a", {
      from: "2026-10-01T00:00:00Z",
      to: "2026-11-01T00:00:00Z",
    });
    expect(prisma.scheduledExercise.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          dog: { userId: "user-a", archivedAt: null },
          deletedAt: null,
          OR: [
            {
              completedAt: {
                gte: new Date("2026-10-01T00:00:00Z"),
                lt: new Date("2026-11-01T00:00:00Z"),
              },
            },
            {
              completedAt: null,
              startsAt: {
                gte: new Date("2026-10-01T00:00:00Z"),
                lt: new Date("2026-11-01T00:00:00Z"),
              },
            },
          ],
        },
        omit: { undoToken: true, undoState: true, deletedAt: true },
      }),
    );
  });
});

describe("scheduled exercise actions", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  const prisma = mockDeep<PrismaService>();
  const service = new EventsService(prisma);
  const now = new Date("2026-10-24T12:00:00Z");
  const event = {
    id: "event-a",
    dogId: "dog-a",
    exerciseId: "exercise-a",
    startsAt: new Date("2026-10-25T08:00:00Z"),
    durationMinutes: 10,
    createdAt: now,
    rating: null,
    note: null,
    completedAt: null,
    deletedAt: null,
    undoToken: null,
    undoState: null,
  };
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(now);
    prisma.$transaction.mockImplementation(async (callback: unknown) =>
      (callback as (tx: unknown) => Promise<unknown>)(prisma),
    );
    prisma.scheduledExercise.findFirst.mockResolvedValue(event);
    prisma.scheduledExercise.findMany.mockResolvedValue([]);
    prisma.scheduledExercise.updateMany.mockResolvedValue({ count: 1 });
  });
  it("attributes early completion to today and overdue completion to its scheduled date", async () => {
    await service.complete("user-a", event.id, {
      rating: 4,
      note: " Great work ",
    });
    expect(prisma.scheduledExercise.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          completedAt: now,
          rating: 4,
          note: "Great work",
        }),
      }),
    );
    const past = new Date("2026-10-20T08:00:00Z");
    prisma.scheduledExercise.findFirst.mockResolvedValue({
      ...event,
      startsAt: past,
    });
    await service.complete("user-a", event.id, { rating: 5 });
    expect(prisma.scheduledExercise.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ completedAt: past, note: null }),
      }),
    );
  });
  it("keeps the completion date when editing a result", async () => {
    const completedAt = new Date("2026-10-22T08:00Z");
    prisma.scheduledExercise.findFirst.mockResolvedValue({
      ...event,
      completedAt,
      rating: 3,
    });
    await service.complete("user-a", event.id, { rating: 5, note: "Updated" });
    expect(prisma.scheduledExercise.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ completedAt, rating: 5 }),
      }),
    );
  });
  it.each(["delete", "reopen"] as const)(
    "saves a server-side snapshot for %s and restores it once",
    async (action) => {
      const completedAt = new Date("2026-10-22T08:00Z");
      prisma.scheduledExercise.findFirst.mockResolvedValue({
        ...event,
        completedAt,
        rating: 4,
        note: "Keep me",
      });
      const { token } = await service.discard("user-a", event.id, action);
      const snapshot = {
        rating: 4,
        note: "Keep me",
        completedAt: completedAt.toISOString(),
        deletedAt: null,
      };
      expect(prisma.scheduledExercise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            undoToken: token,
            undoState: snapshot,
            ...(action === "reopen"
              ? { rating: null, note: null, completedAt: null }
              : { deletedAt: expect.any(Date) }),
          }),
        }),
      );
      prisma.scheduledExercise.findFirst.mockResolvedValue({
        ...event,
        undoToken: token,
        undoState: snapshot,
      });
      await expect(service.undo("user-a", event.id, token)).resolves.toEqual({
        restored: true,
      });
      expect(prisma.scheduledExercise.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: event.id, undoToken: token },
          data: expect.objectContaining({
            rating: 4,
            note: "Keep me",
            completedAt,
            deletedAt: null,
            undoToken: null,
          }),
        }),
      );
      prisma.scheduledExercise.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.undo("user-a", event.id, token)).rejects.toThrow(
        "no longer be undone",
      );
    },
  );
  it("rejects stale undo tokens", async () => {
    await expect(service.undo("user-a", event.id, "stale")).rejects.toThrow(
      "no longer be undone",
    );
    expect(prisma.scheduledExercise.updateMany).not.toHaveBeenCalled();
  });
  it("rejects past rescheduling dates in the handler’s timezone", async () => {
    await expect(
      service.move("user-a", event.id, {
        startsAt: "2000-01-01T08:00Z",
        durationMinutes: 10,
        timeZone: "Europe/Prague",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.scheduledExercise.update).not.toHaveBeenCalled();
  });
  it("reschedules unfinished exercises and rejects completed ones", async () => {
    const startsAt = "2099-01-01T08:00:00Z";
    await service.move("user-a", event.id, {
      startsAt,
      durationMinutes: 30,
      timeZone: "Europe/Prague",
    });
    expect(prisma.scheduledExercise.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          startsAt: new Date(startsAt),
          durationMinutes: 30,
        }),
      }),
    );
    prisma.scheduledExercise.findFirst.mockResolvedValue({
      ...event,
      completedAt: now,
      rating: 5,
    });
    await expect(
      service.move("user-a", event.id, {
        startsAt,
        durationMinutes: 30,
        timeZone: "Europe/Prague",
      }),
    ).rejects.toThrow("cannot be moved");
  });
  it("rejects moving onto a day where the dog already has the same exercise", async () => {
    const move = (startsAt: string) =>
      service.move("user-a", event.id, {
        startsAt,
        durationMinutes: 10,
        timeZone: "Europe/Prague",
      });
    // 23:30 UTC on 26 Oct is already 27 Oct in Prague.
    prisma.scheduledExercise.findMany.mockResolvedValue([
      { startsAt: new Date("2026-10-26T23:30:00Z") },
    ] as never);
    await expect(move("2026-10-27T16:00:00Z")).rejects.toThrow(
      "already has this exercise",
    );
    expect(prisma.scheduledExercise.update).not.toHaveBeenCalled();
    expect(prisma.scheduledExercise.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: event.id },
          dogId: event.dogId,
          exerciseId: event.exerciseId,
          deletedAt: null,
        }),
      }),
    );
    await move("2026-10-28T16:00:00Z");
    expect(prisma.scheduledExercise.update).toHaveBeenCalledOnce();
  });
  it.each(["complete", "move", "delete", "reopen", "undo"])(
    "does not allow %s on another handler’s event",
    async (action) => {
      prisma.scheduledExercise.findFirst.mockResolvedValue(null);
      const request =
        action === "complete"
          ? service.complete("other", event.id, { rating: 4 })
          : action === "move"
            ? service.move("other", event.id, {
                startsAt: "2099-01-01T08:00Z",
                durationMinutes: 10,
                timeZone: "UTC",
              })
            : action === "undo"
              ? service.undo("other", event.id, "token")
              : service.discard(
                  "other",
                  event.id,
                  action as "delete" | "reopen",
                );
      await expect(request).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.scheduledExercise.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: event.id,
            dog: { userId: "other", archivedAt: null },
          }),
        }),
      );
      expect(prisma.scheduledExercise.update).not.toHaveBeenCalled();
      expect(prisma.scheduledExercise.updateMany).not.toHaveBeenCalled();
    },
  );
});
