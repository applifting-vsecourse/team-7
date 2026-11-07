import { isThisWeek, type LocalCalendar } from "@/shared/domain/local-calendar";

export type DogDiscipline = {
  dog: { id: string; name: string; avatarVersion: string | null };
  discipline: { id: string; name: string };
};

/**
 * A training reduced to the dog and discipline it trains. A lesson with a
 * trainer (#70) has no exercise, so it trains no discipline.
 */
export type DisciplineTraining = {
  dogId: string;
  startsAt: Date;
  completedAt: Date | null;
  exercise: { goal: { disciplineId: string } } | null;
};

const keyOf = (dogId: string, disciplineId: string) =>
  `${dogId}:${disciplineId}`;

type Training = Omit<DisciplineTraining, "startsAt">;

const trainingKey = ({ dogId, exercise }: Training) =>
  exercise ? [keyOf(dogId, exercise.goal.disciplineId)] : [];

/**
 * Distinct dog–discipline pairs with nothing this week. Any training this week,
 * in any state, counts as training the discipline.
 */
export function untrainedThisWeek(
  pairs: DogDiscipline[],
  trainings: DisciplineTraining[],
  calendar: LocalCalendar,
): DogDiscipline[] {
  const trained = new Set(
    trainings
      .filter((training) =>
        isThisWeek(
          calendar,
          calendar.dayOf(training.completedAt ?? training.startsAt),
        ),
      )
      .flatMap(trainingKey),
  );
  const distinct = new Map(
    pairs.map((pair) => [keyOf(pair.dog.id, pair.discipline.id), pair]),
  );
  return [...distinct].flatMap(([key, pair]) =>
    trained.has(key) ? [] : [pair],
  );
}

/**
 * Adds each pair's latest completed training and orders the warning: never
 * trained first, then the longest-neglected, then by Czech dog and discipline names.
 */
export function rankNeglected(pairs: DogDiscipline[], completions: Training[]) {
  const lastTrained = new Map<string, Date>();
  for (const training of completions) {
    const [key] = trainingKey(training);
    if (!key) continue;
    const known = lastTrained.get(key);
    if (training.completedAt && (!known || training.completedAt > known))
      lastTrained.set(key, training.completedAt);
  }
  return pairs
    .map((pair) => ({
      ...pair,
      lastTrainedAt:
        lastTrained.get(keyOf(pair.dog.id, pair.discipline.id)) ?? null,
    }))
    .sort(
      (a, b) =>
        (a.lastTrainedAt?.getTime() ?? -Infinity) -
          (b.lastTrainedAt?.getTime() ?? -Infinity) ||
        a.dog.name.localeCompare(b.dog.name, "cs") ||
        a.discipline.name.localeCompare(b.discipline.name, "cs"),
    );
}
