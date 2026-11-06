import { expect, test } from "./fixtures";

test("add a dog without a picture and retain its profile", async ({
  page,
  dog,
  training,
}) => {
  await dog.addDog.click();
  await dog.submit.click();
  await expect(dog.nameRequired).toBeVisible();
  await dog.name.fill(training.dog);
  await dog.breed.fill("Border Collie");
  await dog.submit.click();
  await expect(dog.dialog).toBeHidden();
  await expect(dog.heading(training.dog)).toBeVisible();
  await expect(page).toHaveURL(/\/dogs\/[^/?]+(?:\?|$)/);
  await page.reload();
  await expect(dog.heading(training.dog)).toBeVisible();
});

test("create a library discipline with a goal and exercise", async ({
  page,
  app,
  discipline,
  training,
}) => {
  await app.disciplinesLink.click();
  await discipline.create(training.discipline, "Recall and focus training");
  await discipline.createGoal(
    training.goal,
    "Three successful recalls in a row",
  );
  await discipline.createExercise(
    training.goal,
    training.exercise,
    "Recall away from a toy; reward with tug.",
  );
  await page.reload();
  await expect(discipline.heading(training.discipline)).toBeVisible();
  await expect(discipline.goal(training.goal)).toContainText(
    "Three successful recalls in a row",
  );
  await expect(
    discipline.exercise(training.goal, training.exercise),
  ).toBeVisible();
});

test("assign an exercise to a dog, schedule it, and complete it in the calendar", async ({
  page,
  app,
  dog,
  discipline,
  calendar,
  training,
}) => {
  await test.step("Create a dog and a discipline with a goal and exercise", async () => {
    await dog.create(training.dog);
    await app.disciplinesLink.click();
    await discipline.create(training.discipline, "Recall and focus training");
    await discipline.createGoal(
      training.goal,
      "Three successful recalls in a row",
    );
    await discipline.createExercise(
      training.goal,
      training.exercise,
      "Recall away from a toy; reward with tug.",
    );
  });

  await test.step("Assign the library selection to the new dog", async () => {
    await discipline.assign(training.dog);
    await page.reload();
    await expect(discipline.assignedDog(training.dog)).toBeVisible();
  });

  await test.step("Schedule today's exercise from the calendar", async () => {
    await app.calendarLink.click();
    await calendar.plan(training.dog, training.exercise);
    await expect(calendar.event(training.exercise)).toContainText(training.dog);
  });

  const note = "Three clean recalls; reward with tug.";
  await test.step("Complete the exercise with a rating and note", async () => {
    await calendar.openTraining(training.exercise).click();
    await expect(calendar.complete(training.exercise)).toBeDisabled();
    await calendar.rating(training.exercise, 4).press("Space");
    await calendar.note(training.exercise).fill(note);
    await calendar.complete(training.exercise).click();
    await expect(calendar.trainingDialog(training.exercise)).toBeHidden();
    await expect(calendar.completed(training.exercise)).toBeVisible();
  });

  await test.step("Reload and verify the saved completion, rating and note", async () => {
    await page.reload();
    await expect(calendar.completed(training.exercise)).toBeVisible();
    await calendar.openTraining(training.exercise).click();
    await expect(calendar.rating(training.exercise, 4)).toBeChecked();
    await expect(calendar.note(training.exercise)).toHaveValue(note);
  });
});
