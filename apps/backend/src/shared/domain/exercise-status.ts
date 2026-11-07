import type { Prisma } from "@/generated/prisma/client";

/**
 * The single definition of an exercise a dog can be scheduled for: both the
 * exercise and its goal are in progress. Paused goals do not overwrite their
 * exercises' status, so both levels must be checked. The planning dialog, the
 * schedule endpoint and the neglected-discipline warning (#19) share it.
 */
export const plannableDogExercise = (userId: string) =>
  ({
    status: "in_progress",
    dogGoal: { status: "in_progress", goal: { discipline: { userId } } },
  }) satisfies Prisma.DogExerciseWhereInput;

/**
 * Marks trainings whose exercise is paused for the dog, directly or through its
 * paused goal. They stay in the calendar and can still be completed or moved.
 */
export async function withPaused<
  T extends { dogId: string; exerciseId: string | null },
>(prisma: Prisma.TransactionClient, events: T[]) {
  // Lessons with a trainer (#70) have no exercise and are never paused.
  const pairs = [
    ...new Map(
      events.flatMap(({ dogId, exerciseId }) =>
        exerciseId
          ? [[`${dogId}:${exerciseId}`, { dogId, exerciseId }] as const]
          : [],
      ),
    ).values(),
  ];
  const paused = pairs.length
    ? await prisma.dogExercise.findMany({
        where: {
          OR: pairs,
          AND: {
            OR: [{ status: "paused" }, { dogGoal: { status: "paused" } }],
          },
        },
        select: { dogId: true, exerciseId: true },
      })
    : [];
  const keys = new Set(
    paused.map(({ dogId, exerciseId }) => `${dogId}:${exerciseId}`),
  );
  return events.map((event) => ({
    ...event,
    paused: keys.has(`${event.dogId}:${event.exerciseId}`),
  }));
}
