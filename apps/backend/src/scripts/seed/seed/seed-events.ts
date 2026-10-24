import { PrismaService } from "@/core/prisma/prisma.service";

export async function seedEvents(prisma: PrismaService): Promise<void> {
  const dogs = await prisma.dog.findMany({
    where: { archivedAt: null },
    select: {
      id: true,
      goals: {
        where: { completedAt: null, exercises: { some: {} } },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          exercises: {
            orderBy: { createdAt: "asc" },
            take: 1,
            select: { exerciseId: true },
          },
        },
      },
    },
  });
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(18, 0, 0, 0);

  for (const dog of dogs) {
    const exercise = dog.goals[0]?.exercises[0];
    if (!exercise) continue;

    // Keep a stable ID so rerunning the seed preserves completion or deletion.
    await prisma.scheduledExercise.upsert({
      where: { id: `seed-overdue-${dog.id}` },
      update: {},
      create: {
        id: `seed-overdue-${dog.id}`,
        dogId: dog.id,
        exerciseId: exercise.exerciseId,
        startsAt: yesterday,
        durationMinutes: 10,
      },
    });
  }
}
