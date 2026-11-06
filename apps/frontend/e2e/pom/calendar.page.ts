import { expect, type Page } from "@playwright/test";

export class CalendarPage {
  constructor(readonly page: Page) {}

  get heading() {
    return this.page.getByRole("heading", {
      name: "Calendar",
      exact: true,
    });
  }
  get weeklyHeading() {
    return this.page.getByRole("heading", {
      name: "Weekly overview",
      exact: true,
    });
  }
  get scheduleExercise() {
    return this.page.getByRole("button", {
      name: "Schedule exercise",
      exact: true,
    });
  }
  get scheduleDialog() {
    return this.page.getByRole("dialog", {
      name: "Schedule exercise",
      exact: true,
    });
  }
  get continueScheduling() {
    return this.scheduleDialog.getByRole("button", {
      name: "Continue",
      exact: true,
    });
  }
  get date() {
    return this.scheduleDialog.getByLabel("Date", { exact: true });
  }
  get start() {
    return this.scheduleDialog.getByLabel("Start", { exact: true });
  }
  get schedule() {
    return this.scheduleDialog.getByRole("button", {
      name: "Schedule 1 exercises",
      exact: true,
    });
  }

  schedulingDog(name: string) {
    return this.scheduleDialog.getByRole("radio", { name });
  }

  schedulingExercise(name: string) {
    return this.scheduleDialog.getByRole("checkbox", { name, exact: true });
  }

  event(name: string) {
    return this.page.getByRole("article", { name, exact: true });
  }

  openTraining(name: string) {
    return this.page.getByRole("button", {
      name: `Open training: ${name}`,
      exact: true,
    });
  }

  trainingDialog(name: string) {
    return this.page.getByRole("dialog", { name, exact: true });
  }

  rating(name: string, stars: number) {
    return this.trainingDialog(name).getByRole("radio", {
      name: `${stars} out of 5 stars`,
      exact: true,
    });
  }

  note(name: string) {
    return this.trainingDialog(name).getByRole("textbox", {
      name: "Note",
      exact: true,
    });
  }

  complete(name: string) {
    return this.trainingDialog(name).getByRole("button", {
      name: "Mark as completed",
      exact: true,
    });
  }

  completed(name: string) {
    return this.event(name).getByText("Completed", { exact: true });
  }

  /** A lesson's title is fixed, so it is found by its dog. */
  lesson(dog: string) {
    return this.page
      .getByRole("article", { name: "Session with a trainer", exact: true })
      .filter({ hasText: dog });
  }

  lessonDialog() {
    return this.page.getByRole("dialog", {
      name: "Session with a trainer",
      exact: true,
    });
  }

  async planLesson(dog: string) {
    await this.scheduleExercise.click();
    await this.scheduleDialog
      .getByRole("tab", { name: "With a trainer", exact: true })
      .click();
    await this.schedulingDog(dog).press("Space");
    await this.continueScheduling.click();
    await expect(this.date).not.toHaveValue("");
    await this.start.fill("12:00");
    await this.scheduleDialog
      .getByRole("button", { name: "Schedule", exact: true })
      .click();
    await expect(this.scheduleDialog).toBeHidden();
    await expect(this.lesson(dog)).toBeVisible();
  }

  async plan(dog: string, exercise: string) {
    await this.scheduleExercise.click();
    await this.schedulingDog(dog).press("Space");
    await this.continueScheduling.click();
    await this.schedulingExercise(exercise).press("Space");
    await this.continueScheduling.click();
    // The dialog defaults to today in the browser's timezone.
    await expect(this.date).not.toHaveValue("");
    await this.start.fill("12:00");
    await this.schedule.click();
    await expect(this.scheduleDialog).toBeHidden();
    await expect(this.event(exercise)).toBeVisible();
  }
}
