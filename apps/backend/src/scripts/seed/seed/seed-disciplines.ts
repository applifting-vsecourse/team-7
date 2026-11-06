import { PrismaService } from "@/core/prisma/prisma.service";
import type { DogExerciseStatus } from "@/generated/prisma/client";

type ExerciseSeed = {
  name: string;
  procedure: string;
  // The dogs' status for this exercise; in progress when omitted.
  status?: DogExerciseStatus;
};
type GoalSeed = {
  name: string;
  criterion: string;
  exercises: ExerciseSeed[];
  // Picked by every dog of the user, with this status.
  dogs?: "assigned" | "paused" | "completed";
};
type DisciplineSeed = { name: string; description: string; goals: GoalSeed[] };

// The sample library from the Figma flow "Vytvoření disciplíny, cílů a cvičení".
const disciplines: DisciplineSeed[] = [
  {
    name: "Poslušnost",
    description: "Základní povely a sebekontrola v běžném i rušném prostředí.",
    goals: [
      {
        name: "Pozornost v rušivém prostředí",
        criterion: "Udržet oční kontakt 30 s i v přítomnosti jiných psů.",
        dogs: "completed",
        exercises: [
          { name: "Pozornost na volno", procedure: "5 × 30 s, park" },
          { name: "Pozornost u nohy", procedure: "10 kroků, pak odměna" },
        ],
      },
      {
        name: "Spolehlivé přivolání",
        criterion: "Přiběhnout na první povel i při vyrušení, 9 z 10 pokusů.",
        dogs: "assigned",
        exercises: [
          { name: "Přivolání z 5 metrů", procedure: "10 opakování" },
          // Every exercise status, as in Figma S6. The first exercise stays in
          // progress: seed-events hangs the sample history on it.
          {
            name: "Přivolání z 10 metrů",
            procedure: "10 opakování, s pomocníkem",
            status: "paused",
          },
          {
            name: "Přivolání od hračky",
            procedure: "5 opakování, nejvyšší vzrušení",
            status: "mastered",
          },
        ],
      },
      {
        name: "Chůze u nohy",
        criterion: "Chůze bez tahání 100 m v parku.",
        exercises: [
          { name: "Chůze bez tahání", procedure: "3 × 20 kroků" },
          { name: "Změny tempa", procedure: "5 změn na jednu sérii" },
        ],
      },
    ],
  },
  {
    name: "Canicross",
    description: "Běh v postroji, tempo a povely na trati.",
    goals: [
      {
        name: "Tah v postroji",
        criterion: "Táhnout rovnoměrně 2 km bez zastavení.",
        dogs: "assigned",
        exercises: [
          { name: "Rozběh na povel", procedure: "5 × 50 m" },
          { name: "Udržení tempa", procedure: "3 × 500 m" },
        ],
      },
      {
        name: "Povely na trati",
        criterion: "Reagovat na vlevo, vpravo a stop při běhu.",
        exercises: [
          { name: "Odbočky", procedure: "10 odboček na okruhu" },
          { name: "Zastavení", procedure: "5 zastavení na povel" },
        ],
      },
    ],
  },
  {
    name: "Nosework",
    description: "Hledání pachu v krabicích, interiéru i venku.",
    goals: [
      {
        name: "Hledání v krabicích",
        criterion: "Najít pach v 1 z 10 krabic do 1 minuty.",
        // A paused goal without seeded trainings.
        dogs: "paused",
        exercises: [
          { name: "Jedna krabice", procedure: "10 opakování" },
          { name: "Řada krabic", procedure: "5 krabic, 3 kola" },
          { name: "Krabice s rušením", procedure: "Jídlo v sousední krabici" },
        ],
      },
      {
        name: "Hledání v interiéru",
        criterion: "Prohledat místnost a označit úkryt.",
        exercises: [
          { name: "Nízké úkryty", procedure: "3 úkryty do výšky kolen" },
          { name: "Vysoké úkryty", procedure: "2 úkryty nad hlavou psa" },
        ],
      },
    ],
  },
  {
    name: "Agility",
    description: "Překážky, slalom a vedení na dálku.",
    goals: [],
  },
];

export async function seedDisciplines(prisma: PrismaService): Promise<void> {
  const usersWithoutDisciplines = await prisma.user.findMany({
    where: { disciplines: { none: {} } },
    select: { id: true, dogs: { select: { id: true } } },
  });

  for (const user of usersWithoutDisciplines) {
    for (const discipline of disciplines) {
      const created = await prisma.discipline.create({
        data: {
          userId: user.id,
          name: discipline.name,
          description: discipline.description,
          dogs: discipline.goals.some((goal) => goal.dogs)
            ? { create: user.dogs.map((dog) => ({ dogId: dog.id })) }
            : undefined,
          goals: {
            create: discipline.goals.map((goal) => ({
              name: goal.name,
              criterion: goal.criterion,
              exercises: {
                create: goal.exercises.map(({ name, procedure }, position) => ({
                  name,
                  procedure,
                  position,
                })),
              },
              dogs: goal.dogs && {
                create: user.dogs.map((dog) => ({
                  dogId: dog.id,
                  status: goal.dogs === "assigned" ? "in_progress" : goal.dogs,
                  completedAt: goal.dogs === "completed" ? new Date() : null,
                })),
              },
            })),
          },
        },
        include: { goals: { include: { exercises: true } } },
      });

      // Dogs train every exercise of the goals they picked.
      const dogExercises = created.goals.flatMap((goal) => {
        const seed = discipline.goals.find((item) => item.name === goal.name);
        if (!seed?.dogs) return [];
        return goal.exercises.flatMap((exercise) =>
          user.dogs.map((dog) => ({
            dogId: dog.id,
            goalId: goal.id,
            exerciseId: exercise.id,
            status: seed.exercises.find((item) => item.name === exercise.name)
              ?.status,
          })),
        );
      });
      if (dogExercises.length > 0) {
        await prisma.dogExercise.createMany({ data: dogExercises });
      }
    }
  }

  if (usersWithoutDisciplines.length > 0) {
    console.log(
      `Created disciplines for ${usersWithoutDisciplines.length} user(s).`,
    );
  }
}
