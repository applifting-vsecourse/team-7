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

    // Stable IDs avoid duplicates and preserve edits, completion and deletion.
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

    // A varied history makes the exercise's rating chart useful immediately.
    const history = [
      { daysAgo: 18, rating: 3 },
      { daysAgo: 16, rating: 4 },
      { daysAgo: 14, rating: 4 },
      { daysAgo: 11, rating: 3 },
      { daysAgo: 8, rating: 5 },
      { daysAgo: 5, rating: 4 },
      { daysAgo: 3, rating: 5 },
      { daysAgo: 2, rating: 4 },
    ];
    for (const [index, session] of history.entries()) {
      const startsAt = new Date();
      startsAt.setDate(startsAt.getDate() - session.daysAgo);
      startsAt.setHours(18, 0, 0, 0);
      const id = `seed-history-${dog.id}-${exercise.exerciseId}-${index}`;
      await prisma.scheduledExercise.upsert({
        where: { id },
        update: {},
        create: {
          id,
          dogId: dog.id,
          exerciseId: exercise.exerciseId,
          startsAt,
          completedAt: startsAt,
          durationMinutes: 15,
          rating: session.rating,
          note: index === 6 ? "Poprvé na volno bez vodítka." : null,
        },
      });
    }

    // Upcoming sessions exercise the overview's Today and Tomorrow groups too.
    for (const offset of [0, 1]) {
      const startsAt = new Date();
      startsAt.setDate(startsAt.getDate() + offset);
      startsAt.setHours(18, 0, 0, 0);
      // The same calendar day has one identity, whether seeded as today or tomorrow.
      const day = [
        startsAt.getFullYear(),
        String(startsAt.getMonth() + 1).padStart(2, "0"),
        String(startsAt.getDate()).padStart(2, "0"),
      ].join("-");
      const id = `seed-planned-${dog.id}-${day}`;
      await prisma.scheduledExercise.upsert({
        where: { id },
        update: {},
        create: {
          id,
          dogId: dog.id,
          exerciseId: exercise.exerciseId,
          startsAt,
          durationMinutes: 20,
        },
      });
    }
  }
}
