import { PrismaService } from "@/core/prisma/prisma.service";

type ExerciseSeed = { name: string; procedure: string };
type GoalSeed = {
  name: string;
  criterion: string;
  exercises: ExerciseSeed[];
  // Picked by every dog of the user; "completed" also marks it achieved.
  dogs?: "assigned" | "completed";
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
          {
            name: "Přivolání z 10 metrů",
            procedure: "10 opakování, s pomocníkem",
          },
          {
            name: "Přivolání od hračky",
            procedure: "5 opakování, nejvyšší vzrušení",
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
        dogs: "assigned",
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
          goals: {
            create: discipline.goals.map((goal) => ({
              name: goal.name,
              criterion: goal.criterion,
              exercises: { create: goal.exercises },
              dogs: goal.dogs && {
                create: user.dogs.map((dog) => ({
                  dogId: dog.id,
                  completedAt: goal.dogs === "completed" ? new Date() : null,
                })),
              },
            })),
          },
        },
        include: { goals: { include: { exercises: true } } },
      });

      // Dogs train every exercise of the goals they picked.
      const picked = created.goals.filter(
        (goal) =>
          discipline.goals.find((seed) => seed.name === goal.name)?.dogs,
      );
      const dogExercises = picked.flatMap((goal) =>
        goal.exercises.flatMap((exercise) =>
          user.dogs.map((dog) => ({
            dogId: dog.id,
            goalId: goal.id,
            exerciseId: exercise.id,
          })),
        ),
      );
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
