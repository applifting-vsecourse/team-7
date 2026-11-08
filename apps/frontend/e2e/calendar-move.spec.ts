import { addDays, format, isSameWeek } from "date-fns";

import { expect, test, trainingPlan } from "./fixtures";

test("reschedule a training to another day and time in the calendar", async ({
  page,
  app,
  dog,
  discipline,
  calendar,
  training,
}) => {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const todayDate = format(today, "yyyy-MM-dd");
  const tomorrowDate = format(tomorrow, "yyyy-MM-dd");
  // On Sundays tomorrow is in the next week (weeks start on Monday).
  const nextWeek = !isSameWeek(today, tomorrow, { weekStartsOn: 1 });

  await test.step("Schedule today's exercise at 12:00", async () => {
    await trainingPlan(page, { app, dog, discipline }, training);
    await app.calendarLink.click();
    await calendar.plan(training.dog, training.exercise);
    await expect(
      calendar.day(todayDate).getByRole("article", { name: training.exercise }),
    ).toContainText("12:00");
  });

  await test.step("Reschedule it to tomorrow at 15:30", async () => {
    await calendar.reschedule(training.exercise, tomorrowDate, "15:30");
    await expect(page.getByText("Training rescheduled.")).toBeVisible();
    await expect(
      calendar.day(todayDate).getByRole("article", { name: training.exercise }),
    ).toHaveCount(0);
  });

  await test.step("Find it on tomorrow after a reload", async () => {
    await page.reload();
    if (nextWeek) await calendar.nextWeek.click();
    await expect(
      calendar
        .day(tomorrowDate)
        .getByRole("article", { name: training.exercise }),
    ).toContainText("15:30");
  });
});
