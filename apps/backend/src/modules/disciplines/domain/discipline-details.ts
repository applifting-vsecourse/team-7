import type { Dog, Prisma } from "@/generated/prisma/client";

export type DogRef = Pick<Dog, "id" | "text">;

export type DisciplineSummary = {
  id: string;
  name: string;
  description: string | null;
  goalCount: number;
  exerciseCount: number;
  // Dogs with at least one goal of the discipline.
  dogs: DogRef[];
};

export type ExerciseDetail = {
  id: string;
  name: string;
  procedure: string | null;
  dogCount: number;
};

export type GoalDetail = {
  id: string;
  name: string;
  criterion: string | null;
  exercises: ExerciseDetail[];
  dogs: DogRef[];
};

export type DisciplineDog = DogRef & {
  goalCount: number;
  completedGoalCount: number;
};

export type DisciplineDetail = {
  id: string;
  name: string;
  description: string | null;
  goals: GoalDetail[];
  dogs: DisciplineDog[];
};

const dogRef = { select: { id: true, text: true } } as const;
const byCreation = { createdAt: "asc" } as const;

export const disciplineSummaryInclude = {
  goals: {
    select: {
      _count: { select: { exercises: true } },
      dogs: { select: { dog: dogRef } },
    },
  },
} satisfies Prisma.DisciplineInclude;

export const disciplineDetailInclude = {
  goals: {
    orderBy: byCreation,
    include: {
      exercises: {
        orderBy: byCreation,
        include: { _count: { select: { dogs: true } } },
      },
      dogs: {
        orderBy: byCreation,
        select: { completedAt: true, dog: dogRef },
      },
    },
  },
} satisfies Prisma.DisciplineInclude;

type SummaryRow = Prisma.DisciplineGetPayload<{
  include: typeof disciplineSummaryInclude;
}>;
type DetailRow = Prisma.DisciplineGetPayload<{
  include: typeof disciplineDetailInclude;
}>;

export function toDisciplineSummary(row: SummaryRow): DisciplineSummary {
  const dogs = new Map<string, DogRef>();
  for (const goal of row.goals) {
    for (const { dog } of goal.dogs) dogs.set(dog.id, dog);
  }
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    goalCount: row.goals.length,
    exerciseCount: row.goals.reduce(
      (sum, goal) => sum + goal._count.exercises,
      0,
    ),
    dogs: [...dogs.values()],
  };
}

export function toDisciplineDetail(row: DetailRow): DisciplineDetail {
  const dogs = new Map<string, DisciplineDog>();
  for (const goal of row.goals) {
    for (const { dog, completedAt } of goal.dogs) {
      const entry = dogs.get(dog.id) ?? {
        ...dog,
        goalCount: 0,
        completedGoalCount: 0,
      };
      entry.goalCount += 1;
      if (completedAt) entry.completedGoalCount += 1;
      dogs.set(dog.id, entry);
    }
  }
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    goals: row.goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      criterion: goal.criterion,
      exercises: goal.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        procedure: exercise.procedure,
        dogCount: exercise._count.dogs,
      })),
      dogs: goal.dogs.map(({ dog }) => dog),
    })),
    dogs: [...dogs.values()],
  };
}

/** Optional free text: trimmed, and blank becomes null. */
export function optionalText(value: string | undefined): string | null {
  return value?.trim() || null;
}
