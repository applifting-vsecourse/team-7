import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { PrismaService } from "@/core/prisma/prisma.service";
import { DogAvatarsService } from "@/modules/dogs/avatars/avatars.service";
import { DogsController } from "@/modules/dogs/controllers/dogs.controller";
import { DogExerciseDetailsService } from "@/modules/dogs/services/dog-exercise-details.service";
import { DogSelectionService } from "@/modules/dogs/services/dog-selection.service";
import { EventsService } from "@/modules/events/services/events.service";
import { NeglectedDisciplinesService } from "@/modules/overview/services/neglected-disciplines.service";
import { OverviewService } from "@/modules/overview/services/overview.service";
import { SubscriptionService } from "@/modules/users/services/subscription.service";
import { VideoStorageService } from "@/modules/videos/video-storage.service";
import { VideosService } from "@/modules/videos/videos.service";
import type { Identity } from "@/shared/auth/domain/identity";
import {
  assertDogAccess,
  assertPlus,
  hasPlus,
  subscriptionAccess,
} from "./subscription-access";

vi.mock("@/shared/auth/providers/better-auth.provider", async () => {
  const { Inject } = await import("@nestjs/common");
  return { InjectBetterAuth: Inject("BetterAuth") };
});

describe("subscription boundaries", () => {
  const db = mockDeep<PrismaService>();
  const user = { id: "owner" } as Identity;
  const scope = { userId: user.id, dogId: "a", disciplineId: "discipline" };
  beforeEach(() => {
    vi.resetAllMocks();
    db.subscription.findUnique.mockResolvedValue(null);
    db.dogGoal.findMany.mockResolvedValue([]);
    db.dog.findMany.mockResolvedValue([
      {
        id: "a",
        name: "A",
        breed: "private",
        birthDate: new Date(),
        userId: "owner",
      },
    ] as never);
    db.dog.findFirst.mockResolvedValue({ id: "a", archivedAt: null } as never);
    db.discipline.findFirst.mockResolvedValue({ id: "discipline" } as never);
    db.$transaction.mockImplementation(
      (run) => (run as (tx: typeof db) => Promise<unknown>)(db) as never,
    );
  });

  it("grants valid trials and paid periods, including cancelled paid periods, and expires exactly at the deadline", () => {
    const now = new Date("2026-12-01T00:00:00Z");
    expect(hasPlus({ trialEndsAt: now, paidUntil: null }, now)).toBe(false);
    expect(
      hasPlus(
        { trialEndsAt: new Date(now.getTime() + 1), paidUntil: null },
        now,
      ),
    ).toBe(true);
    expect(
      hasPlus(
        { paidUntil: new Date(now.getTime() + 1), trialEndsAt: null },
        now,
      ),
    ).toBe(true);
    expect(hasPlus(null, now)).toBe(false);
  });

  it("requires a durable choice for multiple dogs and rejects access to other dogs", async () => {
    db.dog.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }] as never);
    expect(await subscriptionAccess(db, user.id)).toMatchObject({
      needsDogChoice: true,
      activeDogId: null,
    });
    await expect(assertDogAccess(db, user.id, "a")).rejects.toMatchObject({
      response: { code: "dogChoiceRequired" },
    });
    db.subscription.findUnique.mockResolvedValue({ activeDogId: "a" } as never);
    await expect(assertDogAccess(db, user.id, "a")).resolves.toBeUndefined();
    await expect(assertDogAccess(db, user.id, "b")).rejects.toMatchObject({
      response: { code: "dogLocked" },
    });
    await expect(
      new DogExerciseDetailsService(db).get(user.id, "b", "exercise"),
    ).rejects.toMatchObject({ response: { code: "dogLocked" } });
    expect(db.exercise.findFirst).not.toHaveBeenCalled();
  });

  it("returns only identity metadata for locked dogs and never reads their profile", async () => {
    db.subscription.findUnique.mockResolvedValue({
      activeDogId: "other",
    } as never);
    db.dog.findMany.mockResolvedValue([
      { id: "a", name: "A", breed: "private" },
      { id: "other", name: "Other" },
    ] as never);
    const dogs = new DogsController(db, mockDeep<DogAvatarsService>());
    expect((await dogs.getDogs(user))[0]).toEqual({
      id: "a",
      name: "A",
      locked: true,
      avatarVersion: undefined,
    });
    await expect(dogs.getDog(user, "a")).rejects.toMatchObject({
      response: { code: "dogLocked" },
    });
    expect(db.scheduledExercise.groupBy).not.toHaveBeenCalled();
  });

  it("serializes dog creation and restoration and rejects a second active dog", async () => {
    db.dog.count.mockResolvedValue(1);
    const dogs = new DogsController(db, mockDeep<DogAvatarsService>());
    await expect(dogs.createDog(user, { name: "B" })).rejects.toMatchObject({
      response: { code: "dogLimit" },
    });
    await expect(dogs.restoreDog(user, "archived")).rejects.toMatchObject({
      response: { code: "dogLimit" },
    });
    expect(db.$queryRaw).toHaveBeenCalledTimes(2);
    expect(db.dog.create).not.toHaveBeenCalled();
    expect(db.dog.updateManyAndReturn).not.toHaveBeenCalled();
  });

  it("limits unfinished goals across disciplines, permits existing over-limit goals, and permits reducing them", async () => {
    const selection = new DogSelectionService(db);
    db.dogGoal.count.mockResolvedValueOnce(2).mockResolvedValueOnce(3);
    await expect(
      selection.run(scope, async () => "new goal"),
    ).rejects.toMatchObject({ response: { code: "goalLimit" } });
    expect(db.dogGoal.count).toHaveBeenCalledWith({
      where: {
        dog: { userId: "owner", archivedAt: null, id: "a" },
        status: { not: "completed" },
      },
    });
    db.dogGoal.count.mockResolvedValueOnce(3).mockResolvedValueOnce(3);
    await expect(
      selection.run(scope, async () => "existing paused goal"),
    ).resolves.toBe("existing paused goal");
    db.dogGoal.count.mockResolvedValueOnce(3).mockResolvedValueOnce(2);
    await expect(
      selection.run(scope, async () => "complete goal"),
    ).resolves.toBe("complete goal");
  });

  it("rejects bulk replacement that introduces new unfinished goals above the limit", async () => {
    db.dogGoal.count.mockResolvedValue(3);
    db.dogGoal.findMany
      .mockResolvedValueOnce([
        { dogId: "a", goalId: "one" },
        { dogId: "a", goalId: "two" },
        { dogId: "a", goalId: "three" },
      ] as never)
      .mockResolvedValueOnce([
        { dogId: "a", goalId: "one" },
        { dogId: "a", goalId: "two" },
        { dogId: "a", goalId: "new" },
      ] as never);
    await expect(
      new DogSelectionService(db).run(scope, async () => "replace"),
    ).rejects.toMatchObject({ response: { code: "goalLimit" } });
  });

  it("blocks video metadata and playback admission without Plus", async () => {
    await expect(assertPlus(db, user.id)).rejects.toMatchObject({
      response: { code: "plusRequired" },
    });
    const videos = new VideosService(db, mockDeep<VideoStorageService>());
    await expect(
      videos.assertAccess(user.id, "a", "session"),
    ).rejects.toMatchObject({ response: { code: "plusRequired" } });
    expect(db.video.findMany).not.toHaveBeenCalled();
  });

  it("filters calendar queries and mutations to the chosen dog", async () => {
    db.subscription.findUnique.mockResolvedValue({ activeDogId: "a" } as never);
    db.scheduledExercise.findMany.mockResolvedValue([]);
    await new EventsService(db).list(user.id, {
      from: "2026-12-01T00:00:00Z",
      to: "2026-12-02T00:00:00Z",
    });
    expect(db.scheduledExercise.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ dogId: "a" }),
      }),
    );
    await expect(
      new EventsService(db).exercises(user.id, "b"),
    ).rejects.toMatchObject({ response: { code: "dogLocked" } });
  });

  it("never sends real weekly trends for Free while keeping this week's metrics", async () => {
    const neglected = mockDeep<NeglectedDisciplinesService>();
    neglected.findPlannable.mockResolvedValue([]);
    neglected.rank.mockResolvedValue([]);
    db.scheduledExercise.findMany.mockResolvedValue([]);
    const result = await new OverviewService(db, neglected).get(user.id, {
      timeZone: "Europe/Prague",
    });
    expect(result.stats).toMatchObject({
      trendsLocked: true,
      satisfactionHistory: [],
      plannedExercises: 0,
    });
    expect(neglected.findPlannable).toHaveBeenCalledWith(user.id, ["a"], db);
  });

  it("does not allow switching the chosen dog before renewing Plus", async () => {
    db.dog.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }] as never);
    db.subscription.findUnique.mockResolvedValue({ activeDogId: "a" } as never);
    await expect(
      new SubscriptionService(db).chooseDog(user.id, "b"),
    ).rejects.toMatchObject({ response: { code: "dogChoiceRequired" } });
    expect(db.subscription.upsert).not.toHaveBeenCalled();
  });
});
