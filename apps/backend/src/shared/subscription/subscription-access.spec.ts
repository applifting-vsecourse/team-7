import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { PrismaService } from "@/core/prisma/prisma.service";
import { DogAvatarsController } from "@/modules/dogs/avatars/avatars.controller";
import { DogAvatarsService } from "@/modules/dogs/avatars/avatars.service";
import { DogsController } from "@/modules/dogs/controllers/dogs.controller";
import { DogExerciseDetailsService } from "@/modules/dogs/services/dog-exercise-details.service";
import { DogSelectionService } from "@/modules/dogs/services/dog-selection.service";
import { EventsService } from "@/modules/events/services/events.service";
import { OnboardingService } from "@/modules/onboarding/services/onboarding.service";
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
    db.dog.findFirst.mockResolvedValue({ archivedAt: new Date() } as never);
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

  it.each([5, 6])(
    "rejects creating or restoring a Plus dog with %i active dogs",
    async (count) => {
      db.subscription.findUnique.mockResolvedValue({
        paidUntil: new Date("2999-01-01"),
      } as never);
      db.dog.count.mockResolvedValue(count);
      db.dog.findFirst.mockResolvedValue({ archivedAt: new Date() } as never);
      const dogs = new DogsController(db, mockDeep<DogAvatarsService>());

      await expect(dogs.createDog(user, { name: "New" })).rejects.toMatchObject(
        {
          response: { code: "dogLimit" },
        },
      );
      await expect(dogs.restoreDog(user, "archived")).rejects.toMatchObject({
        response: { code: "dogLimit" },
      });
      expect(db.$queryRaw).toHaveBeenCalledTimes(2);
      expect(db.dog.create).not.toHaveBeenCalled();
      expect(db.dog.updateManyAndReturn).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["Free", 0],
    ["Plus", 4],
  ])(
    "allows creating and restoring a dog below the %s limit",
    async (tier, count) => {
      if (tier === "Plus")
        db.subscription.findUnique.mockResolvedValue({
          paidUntil: new Date("2999-01-01"),
        } as never);
      db.dog.count.mockResolvedValue(count);
      db.dog.findFirst.mockResolvedValue({ archivedAt: new Date() } as never);
      const dog = { id: "new", name: "New" };
      db.dog.create.mockResolvedValue(dog as never);
      db.dog.updateManyAndReturn.mockResolvedValue([dog] as never);
      const dogs = new DogsController(db, mockDeep<DogAvatarsService>());

      await expect(dogs.createDog(user, { name: "New" })).resolves.toEqual(dog);
      await expect(dogs.restoreDog(user, "archived")).resolves.toEqual(dog);
      expect(db.dog.count).toHaveBeenCalledTimes(2);
      expect(db.dog.count).toHaveBeenCalledWith({
        where: { userId: user.id, archivedAt: null },
      });
      expect(db.$queryRaw).toHaveBeenCalledTimes(2);
    },
  );

  it("reports restoring an active dog as a conflict before checking the limit", async () => {
    db.dog.count.mockResolvedValue(1);
    const dogs = new DogsController(db, mockDeep<DogAvatarsService>());
    await expect(dogs.restoreDog(user, "a")).rejects.toMatchObject({
      status: 409,
    });
    expect(db.dog.count).not.toHaveBeenCalled();
  });

  it("lets Free delete and archive a locked dog, and answers 404 for someone else's dog", async () => {
    db.subscription.findUnique.mockResolvedValue({
      activeDogId: "other",
    } as never);
    db.dog.findMany.mockResolvedValue([{ id: "a" }, { id: "other" }] as never);
    db.dog.deleteMany.mockResolvedValue({ count: 1 });
    db.dog.updateManyAndReturn.mockResolvedValue([{ id: "a" }] as never);
    const dogs = new DogsController(db, mockDeep<DogAvatarsService>());

    await expect(dogs.deleteDog(user, "a")).resolves.toBeUndefined();
    await expect(dogs.archiveDog(user, "a")).resolves.toEqual({ id: "a" });

    db.dog.findFirst.mockResolvedValue(null);
    await expect(assertDogAccess(db, user.id, "foreign")).rejects.toMatchObject(
      { status: 404 },
    );
    await expect(dogs.getDog(user, "foreign")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("keeps the Free active dog from being archived while other dogs exist", async () => {
    db.subscription.findUnique.mockResolvedValue({ activeDogId: "a" } as never);
    db.dog.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }] as never);
    db.dog.count.mockResolvedValue(1);
    const dogs = new DogsController(db, mockDeep<DogAvatarsService>());
    await expect(dogs.archiveDog(user, "a")).rejects.toMatchObject({
      response: { code: "activeDogArchive" },
    });

    // An archived dog counts too: archiving "a" and restoring it would swap.
    db.dog.findMany.mockResolvedValue([{ id: "a" }] as never);
    await expect(dogs.archiveDog(user, "a")).rejects.toMatchObject({
      response: { code: "activeDogArchive" },
    });
    expect(db.dog.count).toHaveBeenLastCalledWith({
      where: { userId: user.id, id: { not: "a" } },
    });
    expect(db.dog.updateManyAndReturn).not.toHaveBeenCalled();

    // The only dog, or Plus: archiving is fine.
    db.dog.count.mockResolvedValue(0);
    db.dog.updateManyAndReturn.mockResolvedValue([{ id: "a" }] as never);
    await expect(dogs.archiveDog(user, "a")).resolves.toEqual({ id: "a" });
  });

  it("answers dogArchived for an archived dog on Free, so it can be restored", async () => {
    db.dog.findFirst.mockResolvedValue({ archivedAt: new Date() } as never);
    const dogs = new DogsController(db, mockDeep<DogAvatarsService>());
    await expect(dogs.getDog(user, "archived")).rejects.toMatchObject({
      response: { code: "dogArchived" },
    });
  });

  it("lets Free list and delete saved videos but not upload or play them", async () => {
    const videos = new VideosService(db, mockDeep<VideoStorageService>());
    db.scheduledExercise.findFirst.mockResolvedValue({
      id: "session",
      exerciseId: "exercise",
    } as never);
    await expect(
      videos.assertAccess(user.id, "a", "session", { requirePlus: false }),
    ).resolves.toMatchObject({ id: "session" });
    await expect(
      videos.assertAccess(user.id, "a", "session"),
    ).rejects.toMatchObject({ response: { code: "plusRequired" } });
    db.dog.findFirst.mockResolvedValue(null);
    await expect(
      videos.assertAccess(user.id, "foreign", "session"),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("counts no goals and keeps the tour on the user's dogs before a dog is chosen", async () => {
    db.dog.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }] as never);
    await new SubscriptionService(db).get(user.id);
    expect(db.dogGoal.count).toHaveBeenCalledWith({
      where: {
        dog: { userId: user.id, archivedAt: null, id: "" },
        status: "in_progress",
      },
    });
    db.user.findUniqueOrThrow.mockResolvedValue({} as never);
    db.dog.findFirst.mockResolvedValue(null);
    await new OnboardingService(db).get(user.id, new Date());
    expect(db.dog.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: user.id, archivedAt: null },
      }),
    );
  });

  it("limits in-progress goals across disciplines, permits existing over-limit goals, and permits reducing them", async () => {
    const selection = new DogSelectionService(db);
    db.dogGoal.count.mockResolvedValueOnce(2).mockResolvedValueOnce(3);
    await expect(
      selection.run(scope, async () => "new goal"),
    ).rejects.toMatchObject({ response: { code: "goalLimit" } });
    expect(db.dogGoal.count).toHaveBeenCalledWith({
      where: {
        dog: { userId: "owner", archivedAt: null, id: "a" },
        status: "in_progress",
      },
    });
    db.dogGoal.count.mockResolvedValueOnce(3).mockResolvedValueOnce(3);
    await expect(
      selection.run(scope, async () => "existing in-progress goal"),
    ).resolves.toBe("existing in-progress goal");
    db.dogGoal.count.mockResolvedValueOnce(3).mockResolvedValueOnce(2);
    await expect(
      selection.run(scope, async () => "complete goal"),
    ).resolves.toBe("complete goal");
  });

  it("allows a new goal after pausing one, but rejects resuming it above the limit", async () => {
    const goals: Array<{ status: "in_progress" | "paused" | "completed" }> = [
      { status: "in_progress" },
      { status: "in_progress" },
      { status: "completed" },
    ];
    db.dogGoal.count.mockImplementation(
      ({ where } = {}) =>
        Promise.resolve(
          goals.filter((goal) => goal.status === where?.status).length,
        ) as never,
    );
    const selection = new DogSelectionService(db);

    await expect(
      selection.run(scope, async () => {
        goals[0].status = "paused";
        return "paused";
      }),
    ).resolves.toBe("paused");
    await expect(
      selection.run(scope, async () => {
        goals.push({ status: "in_progress" });
        return "new goal";
      }),
    ).resolves.toBe("new goal");
    await expect(
      selection.run(scope, async () => {
        goals[0].status = "in_progress";
      }),
    ).rejects.toMatchObject({ response: { code: "goalLimit" } });
    expect(db.dogGoal.findMany).toHaveBeenCalledWith({
      where: {
        dog: { userId: "owner", archivedAt: null, id: "a" },
        status: "in_progress",
      },
      select: { dogId: true, goalId: true },
    });
  });

  it("rejects bulk replacement that introduces new in-progress goals above the limit", async () => {
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

  // Photos were dropped from Plus with the PO (Figma spec F-55/F-56).
  it("lets Free upload a dog photo and create a dog with one", async () => {
    const avatars = new DogAvatarsService(db);
    const prepareAvatar = vi.spyOn(avatars, "prepareAvatar").mockResolvedValue({
      avatar: new Uint8Array(),
      avatarVersion: "0-0-0-0-0",
    });
    const file = { buffer: Buffer.from("photo") } as Express.Multer.File;
    db.dog.count.mockResolvedValue(0);
    db.dog.create.mockResolvedValue({ id: "new" } as never);
    db.dog.updateManyAndReturn.mockResolvedValue([{ id: "a" }] as never);

    await expect(
      new DogAvatarsController(avatars).uploadAvatar(user, "a", file),
    ).resolves.toEqual({ id: "a" });
    await expect(
      new DogsController(db, avatars).createDog(user, { name: "New" }, file),
    ).resolves.toEqual({ id: "new" });
    expect(prepareAvatar).toHaveBeenCalledTimes(2);
    prepareAvatar.mockRestore();
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
      successHistory: [],
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
