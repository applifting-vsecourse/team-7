import { PrismaService } from "@/core/prisma/prisma.service";
import { dogExerciseOrder } from "@/shared/domain/exercise-order";

export async function seedEvents(prisma: PrismaService): Promise<void> {
  const dogs = await prisma.dog.findMany({
    where: { archivedAt: null },
    select: {
      id: true,
      goals: {
        where: {
          status: "in_progress",
          exercises: { some: { status: "in_progress" } },
        },
        orderBy: { createdAt: "asc" },
        select: {
          goal: { select: { disciplineId: true } },
          exercises: {
            where: { status: "in_progress" },
            orderBy: dogExerciseOrder,
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

    // A discipline last trained before this week shows in the overview's
    // neglected warning with its date (#19). Untouched ones show as never trained.
    const lapsed = dog.goals.at(-1)!;
    if (lapsed.goal.disciplineId !== dog.goals[0]!.goal.disciplineId) {
      const completedAt = new Date();
      completedAt.setDate(completedAt.getDate() - 10);
      completedAt.setHours(18, 0, 0, 0);
      await prisma.scheduledExercise.upsert({
        where: { id: `seed-lapsed-${dog.id}` },
        update: {},
        create: {
          id: `seed-lapsed-${dog.id}`,
          dogId: dog.id,
          exerciseId: lapsed.exercises[0]!.exerciseId,
          startsAt: completedAt,
          completedAt,
          durationMinutes: 15,
          rating: 3,
        },
      });
    }

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

    // Tomorrow's lesson with a trainer (#70), one identity per calendar day.
    const lessonAt = new Date();
    lessonAt.setDate(lessonAt.getDate() + 1);
    lessonAt.setHours(17, 0, 0, 0);
    const lessonId = `seed-lesson-${dog.id}-${[
      lessonAt.getFullYear(),
      String(lessonAt.getMonth() + 1).padStart(2, "0"),
      String(lessonAt.getDate()).padStart(2, "0"),
    ].join("-")}`;
    await prisma.scheduledExercise.upsert({
      where: { id: lessonId },
      update: {},
      create: {
        id: lessonId,
        kind: "lesson",
        dogId: dog.id,
        startsAt: lessonAt,
        durationMinutes: 60,
      },
    });
  }
}
