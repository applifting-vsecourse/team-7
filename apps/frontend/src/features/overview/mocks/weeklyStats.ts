import type { WeeklyStatsData } from "../components/WeeklyStats";

export const mockedWeeklyStats: WeeklyStatsData = {
  weekStart: "2026-10-11",
  weekEnd: "2026-10-17",
  completedExercises: 9,
  plannedExercises: 18,
  streakDays: 7,
  trainingMinutes: 220,
  satisfaction: 4.3,
  satisfactionHistory: [
    { weekStart: "2026-09-06", rating: 3.4 },
    { weekStart: "2026-09-13", rating: 3.6 },
    { weekStart: "2026-09-20", rating: 3.9 },
    { weekStart: "2026-09-27", rating: 3.8 },
    { weekStart: "2026-10-04", rating: 4.0 },
    { weekStart: "2026-10-11", rating: 4.3 },
  ],
};
