// Project dashboard configuration — the only file the team needs to edit.
// Loaded as a plain <script> so the dashboard works when opened from disk.
window.DASHBOARD_CONFIG = {
  repo: "applifting-vsecourse/team-7",

  // Hard deadline for the project.
  deadline: "2027-01-31",

  // Sprint dates, inclusive (YYYY-MM-DD). Each sprint ends on its Sprint
  // Review. `optional: true` marks the sprints during the exam period.
  // TODO: Sprint 6 and 7 dates are a guess — confirm them with the team.
  sprints: [
    { name: "Sprint 1", start: "2026-10-05", end: "2026-10-12" },
    { name: "Sprint 2", start: "2026-10-13", end: "2026-10-26" },
    { name: "Sprint 3", start: "2026-10-27", end: "2026-11-09" },
    { name: "Sprint 4", start: "2026-11-10", end: "2026-11-23" },
    { name: "Sprint 5", start: "2026-11-24", end: "2026-12-07" },
    {
      name: "Sprint 6",
      start: "2027-01-04",
      end: "2027-01-17",
      optional: true,
    },
    {
      name: "Sprint 7",
      start: "2027-01-18",
      end: "2027-01-31",
      optional: true,
    },
  ],

  // Story points per issue number. `null` = estimated as "?" (unknown).
  // Issues missing here count as not estimated.
  points: {
    14: null, // Předvyplněné plány
  },

  // Issues estimated together. The points are split evenly between members,
  // so finishing one member counts as partial progress of the bundle.
  bundles: [
    {
      name: "Disciplíny, cíle a cvičení",
      issues: [10, 11, 12],
      points: 13,
    },
  ],

  // Closed issues with these labels are cut from scope, not counted as done.
  excludeLabels: ["out of scope"],
};
