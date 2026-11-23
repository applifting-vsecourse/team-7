import type { Dog, Prisma } from "@/generated/prisma/client";
import { exerciseOrder } from "@/shared/domain/exercise-order";

export type DogRef = Pick<Dog, "id" | "name">;

export type DisciplineSummary = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  catalogKey: string | null;
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
  // Every non-archived dog with the goal, including dogs locked on Free:
  // deleting the goal removes their plans too.
  dogCount: number;
};

export type DisciplineDog = DogRef & {
  goalCount: number;
  completedGoalCount: number;
  // Exercises the dog trains across its goals of the discipline.
  exerciseCount: number;
};

export type DisciplineDetail = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  catalogKey: string | null;
  goals: GoalDetail[];
  dogs: DisciplineDog[];
  // Like GoalDetail.dogCount, for the delete warning.
  dogCount: number;
};

const dogRef = { select: { id: true, name: true } } as const;
const byCreation = { createdAt: "asc" } as const;
// Archived dogs are hidden from the library until they are restored.
const activeDog = { dog: { archivedAt: null } } as const;

export const disciplineSummaryInclude = {
  goals: {
    select: {
      _count: { select: { exercises: true } },
      dogs: { where: activeDog, select: { dog: dogRef } },
    },
  },
} satisfies Prisma.DisciplineInclude;

export const disciplineDetailInclude = {
  goals: {
    orderBy: byCreation,
    include: {
      exercises: {
        orderBy: exerciseOrder,
        include: { _count: { select: { dogs: true } } },
      },
      dogs: {
        where: activeDog,
        orderBy: byCreation,
        select: {
          status: true,
          dog: dogRef,
          _count: { select: { exercises: true } },
        },
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
    category: row.category,
    catalogKey: row.catalogKey,
    goalCount: row.goals.length,
    exerciseCount: row.goals.reduce(
      (sum, goal) => sum + goal._count.exercises,
      0,
    ),
    dogs: [...dogs.values()],
  };
}

/** `isVisible` hides dogs locked on Free; counts still include them. */
export function toDisciplineDetail(
  row: DetailRow,
  isVisible: (dogId: string) => boolean = () => true,
): DisciplineDetail {
  const dogs = new Map<string, DisciplineDog>();
  const allDogs = new Set<string>();
  for (const goal of row.goals) {
    for (const { dog, status, _count } of goal.dogs) {
      allDogs.add(dog.id);
      if (!isVisible(dog.id)) continue;
      const entry = dogs.get(dog.id) ?? {
        ...dog,
        goalCount: 0,
        completedGoalCount: 0,
        exerciseCount: 0,
      };
      entry.goalCount += 1;
      entry.exerciseCount += _count.exercises;
      if (status === "completed") entry.completedGoalCount += 1;
      dogs.set(dog.id, entry);
    }
  }
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    catalogKey: row.catalogKey,
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
      dogs: goal.dogs.map(({ dog }) => dog).filter(({ id }) => isVisible(id)),
      dogCount: goal.dogs.length,
    })),
    dogs: [...dogs.values()],
    dogCount: allDogs.size,
  };
}
