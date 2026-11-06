import type { ExerciseStatus, GoalStatus } from "../schemas/statusSchema";

/**
 * Mirrors the backend's plannableDogExercise: only an exercise in progress of
 * a goal in progress is offered when scheduling.
 */
export const isPlannable = (goalStatus: GoalStatus, status: ExerciseStatus) =>
  goalStatus === "in_progress" && status === "in_progress";

/**
 * A paused goal shows its exercises in progress as paused without changing
 * their own status, so they come back when the goal is resumed.
 */
export const displayedExerciseStatus = (
  goalStatus: GoalStatus,
  status: ExerciseStatus,
): ExerciseStatus =>
  goalStatus === "paused" && status === "in_progress" ? "paused" : status;
