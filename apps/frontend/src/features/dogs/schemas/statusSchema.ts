import { z } from "zod";

// Status of a goal / exercise for one dog (never for the library item).
export const goalStatusSchema = z.enum(["in_progress", "paused", "completed"]);
export const exerciseStatusSchema = z.enum([
  "in_progress",
  "paused",
  "mastered",
]);
export type GoalStatus = z.infer<typeof goalStatusSchema>;
export type ExerciseStatus = z.infer<typeof exerciseStatusSchema>;
