import { expect, test, trainingPlan } from "./fixtures";

test("a paused goal stays scheduled in the calendar but is not offered for planning", async ({
  page,
  app,
  dog,
  discipline,
  dogDiscipline,
  calendar,
  training,
}) => {
  const dogUrl = await trainingPlan(page, { app, dog, discipline }, training);

  await test.step("Schedule the exercise while the goal is in progress", async () => {
    await app.calendarLink.click();
    await calendar.plan(training.dog, training.exercise);
  });

  await test.step("Pause the goal and keep it paused after a reload", async () => {
    await dogDiscipline.open(dogUrl, training.discipline);
    await dogDiscipline.goalAction(training.goal, "Pause goal");
    await expect(dogDiscipline.pausedGoals).toHaveText("Paused goals (1)");
    await expect(dogDiscipline.toast("Goal paused")).toBeVisible();
    await page.reload();
    await expect(dogDiscipline.pausedGoals).toBeVisible();
    await expect(dogDiscipline.goal(training.goal)).toContainText("Paused");
  });

  await test.step("The scheduled training stays in the calendar, marked as paused", async () => {
    await app.calendarLink.click();
    await expect(calendar.event(training.exercise)).toContainText("Paused");
  });

  await test.step("Planning lists the paused goal read-only", async () => {
    await calendar.scheduleExercise.click();
    await calendar.schedulingDog(training.dog).press("Space");
    await calendar.continueScheduling.click();
    const pausedGoals = calendar.scheduleDialog.getByRole("button", {
      name: "Paused goals (1)",
    });
    await pausedGoals.click();
    await expect(
      calendar.scheduleDialog.getByText(training.goal, { exact: true }),
    ).toBeVisible();
    await expect(calendar.schedulingExercise(training.exercise)).toHaveCount(0);
  });
});

test("a failed status change keeps the saved status and can be retried", async ({
  page,
  context,
  app,
  dog,
  discipline,
  dogDiscipline,
  training,
}) => {
  const dogUrl = await trainingPlan(page, { app, dog, discipline }, training);
  await dogDiscipline.open(dogUrl, training.discipline);

  await test.step("A server error rolls back and offers a retry", async () => {
    const goals = "**/api/dogs/*/disciplines/*/goals/*";
    await page.route(goals, (route) =>
      route.request().method() === "PATCH"
        ? route.fulfill({ status: 500, json: { message: "Prepared failure" } })
        : route.fallback(),
    );
    await dogDiscipline.markComplete.click();
    await expect(dogDiscipline.saveError).toBeVisible();
    await expect(dogDiscipline.completedGoals).toHaveCount(0);
    await expect(dogDiscipline.markComplete).toBeVisible();
    await page.unroute(goals);
    await dogDiscipline.retry.click();
    await expect(dogDiscipline.completedGoals).toHaveText(
      "Completed goals (1)",
    );
  });

  await test.step("A network outage rolls back and offers a retry", async () => {
    await context.setOffline(true);
    await dogDiscipline.goalAction(training.goal, "Return to in progress");
    await expect(dogDiscipline.saveError).toBeVisible();
    await expect(dogDiscipline.completedGoals).toBeVisible();
    await context.setOffline(false);
    await dogDiscipline.retry.click();
    await expect(dogDiscipline.markComplete).toBeVisible();
    await expect(dogDiscipline.completedGoals).toHaveCount(0);
    await page.reload();
    await expect(dogDiscipline.markComplete).toBeVisible();
  });
});
