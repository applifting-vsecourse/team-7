import { expect, test, trainingPlan } from "./fixtures";

test("a discipline without training this week is flagged until it is scheduled", async ({
  page,
  app,
  dog,
  discipline,
  calendar,
  overview,
  training,
}) => {
  await trainingPlan(page, { app, dog, discipline }, training);
  const row = overview.neglectedRow(training.dog, training.discipline);

  await test.step("The overview warns about the new in-progress discipline", async () => {
    await app.overviewLink.click();
    await overview.showOnly(training.dog);
    await expect(row).toContainText("not trained yet");
  });

  await test.step("Scheduling from the warning removes it", async () => {
    await overview.scheduleNeglected(training.dog, training.discipline).click();
    await calendar.schedulingExercise(training.exercise).press("Space");
    await calendar.continueScheduling.click();
    await calendar.start.fill("12:00");
    await calendar.schedule.click();
    await expect(calendar.scheduleDialog).toBeHidden();
    await expect(overview.neglected).toBeHidden();
  });

  await test.step("Deleting the only training brings the warning back", async () => {
    await app.calendarLink.click();
    await calendar.openTraining(training.exercise).click();
    await calendar
      .trainingDialog(training.exercise)
      .getByRole("button", { name: "Training actions" })
      .click();
    await page.getByRole("menuitem", { name: "Delete training" }).click();
    await expect(calendar.event(training.exercise)).toBeHidden();
    await app.overviewLink.click();
    await expect(row).toBeVisible();
  });
});

test("a failed overview load shows an error with a retry", async ({
  page,
  context,
  app,
  dog,
  discipline,
  overview,
  training,
}) => {
  await trainingPlan(page, { app, dog, discipline }, training);
  const row = overview.neglectedRow(training.dog, training.discipline);

  await test.step("A server error", async () => {
    const route = "**/api/events/overview?*";
    await page.route(route, (request) =>
      request.fulfill({ status: 500, json: { message: "Prepared failure" } }),
    );
    await app.overviewLink.click();
    await expect(overview.loadError).toBeVisible();
    await expect(overview.neglected).toBeHidden();
    await page.unroute(route);
    await overview.retry.click();
    await overview.showOnly(training.dog);
    await expect(row).toBeVisible();
  });

  await test.step("A network outage", async () => {
    // Unchecking the only dog loads a new, uncached selection.
    await context.setOffline(true);
    await overview.filterDog(training.dog).press("Space");
    await expect(overview.loadError).toBeVisible();
    await context.setOffline(false);
    await overview.retry.click();
    await expect(overview.loadError).toBeHidden();
    await overview.filterDog(training.dog).press("Space");
    await expect(row).toBeVisible();
  });
});
