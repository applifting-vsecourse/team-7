import type { Prisma } from "@/generated/prisma/client";

/**
 * The handler's order of exercises within a goal (#73). Creation breaks ties,
 * e.g. between exercises added at the same moment.
 */
export const exerciseOrder = [
  { position: "asc" },
  { createdAt: "asc" },
] satisfies Prisma.ExerciseOrderByWithRelationInput[];

/** Orders a dog's exercises the same way as the library exercises. */
export const dogExerciseOrder = exerciseOrder.map((order) => ({
  exercise: order,
})) satisfies Prisma.DogExerciseOrderByWithRelationInput[];

/** Position that puts a new exercise at the end of its goal. */
export async function nextExercisePosition(
  prisma: Prisma.TransactionClient,
  goalId: string,
): Promise<number> {
  const { _max } = await prisma.exercise.aggregate({
    where: { goalId },
    _max: { position: true },
  });
  return (_max.position ?? -1) + 1;
}
