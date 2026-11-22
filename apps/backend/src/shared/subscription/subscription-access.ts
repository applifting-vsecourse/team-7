import { ForbiddenException, NotFoundException } from "@nestjs/common";
import type { Prisma, Subscription } from "@/generated/prisma/client";

type AccessDb = Pick<Prisma.TransactionClient, "subscription" | "dog">;
export const hasPlus = (
  s: Pick<Subscription, "paidUntil" | "trialEndsAt"> | null,
  now = new Date(),
) =>
  Boolean(
    (s?.paidUntil && s.paidUntil > now) ||
    (s?.trialEndsAt && s.trialEndsAt > now),
  );

export function subscriptionRequired(
  code:
    | "dogLocked"
    | "dogLimit"
    | "goalLimit"
    | "plusRequired"
    | "dogChoiceRequired",
) {
  return new ForbiddenException({
    code,
    message: "This action requires Plus or an active dog selection",
  });
}

export async function subscriptionAccess(db: AccessDb, userId: string) {
  const subscription = await db.subscription.findUnique({ where: { userId } });
  if (hasPlus(subscription))
    return { isPlus: true, activeDogId: null, needsDogChoice: false };
  const dogs = await db.dog.findMany({
    where: { userId, archivedAt: null },
    select: { id: true },
  });
  const activeDogId =
    dogs.find((dog) => dog.id === subscription?.activeDogId)?.id ??
    (dogs.length === 1 ? dogs[0].id : null);
  return {
    isPlus: false,
    activeDogId,
    needsDogChoice: dogs.length > 1 && !activeDogId,
  };
}

export async function assertDogAccess(
  db: AccessDb,
  userId: string,
  dogId: string,
) {
  const access = await subscriptionAccess(db, userId);
  if (access.isPlus || access.activeDogId === dogId) return;
  // A missing or foreign dog is "not found", never an upsell.
  if (!(await db.dog.findFirst({ where: { id: dogId, userId } })))
    throw new NotFoundException("Dog not found");
  throw subscriptionRequired(
    access.needsDogChoice ? "dogChoiceRequired" : "dogLocked",
  );
}

export async function assertPlus(db: AccessDb, userId: string) {
  const subscription = await db.subscription.findUnique({ where: { userId } });
  if (!hasPlus(subscription)) throw subscriptionRequired("plusRequired");
}

// Serialize quota changes across every dog and discipline for this account.
// Acquire this before any reads in a write transaction.
export async function lockSubscription(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`;
}
