import { ConflictException, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@/generated/prisma/client";

type DogReader = Pick<Prisma.TransactionClient, "dog">;

/** The signed-in user's dog, archived or not; 404 when it isn't theirs. */
export async function findOwnedDog(db: DogReader, userId: string, id: string) {
  const dog = await db.dog.findFirst({
    where: { id, userId },
    select: { id: true, archivedAt: true },
  });
  if (!dog) throw new NotFoundException("Dog not found");
  return dog;
}

/**
 * An archived dog is read-only until it is restored. Every write to a dog or
 * its plan goes through this check; reads use findOwnedDog.
 */
export async function findActiveDog(db: DogReader, userId: string, id: string) {
  const dog = await findOwnedDog(db, userId, id);
  if (dog.archivedAt)
    throw new ConflictException("Dog is archived; restore it first");
  return dog;
}
