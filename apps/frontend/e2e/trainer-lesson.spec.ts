import { expect, test } from "./fixtures";

test("schedule a lesson with a trainer, complete it, delete it and undo", async ({
  page,
  app,
  dog,
  calendar,
  training,
}) => {
  await test.step("Schedule a lesson for a new dog", async () => {
    await dog.create(training.dog);
    await app.calendarLink.click();
    await calendar.planLesson(training.dog);
    await expect(calendar.lesson(training.dog)).toContainText("12:00");
  });

  await test.step("See it in the overview's Today column after a reload", async () => {
    await app.overviewLink.click();
    await page.reload();
    await expect(calendar.lesson(training.dog)).toBeVisible();
  });

  const dialog = calendar.lessonDialog();
  await test.step("Complete it without a rating", async () => {
    await app.calendarLink.click();
    await calendar.lesson(training.dog).getByRole("button").click();
    await dialog.getByRole("button", { name: "Mark as completed" }).click();
    await expect(dialog).toBeHidden();
    await expect(
      calendar.lesson(training.dog).getByText("Completed", { exact: true }),
    ).toBeVisible();
  });

  await test.step("Delete it and undo the deletion", async () => {
    await calendar.lesson(training.dog).getByRole("button").click();
    await dialog.getByRole("button", { name: "Training actions" }).click();
    await page.getByRole("menuitem", { name: "Delete training" }).click();
    await expect(calendar.lesson(training.dog)).toBeHidden();
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(calendar.lesson(training.dog)).toBeVisible();
    await page.reload();
    await expect(calendar.lesson(training.dog)).toBeVisible();
  });
});
