import { expect, type Page } from "@playwright/test";

export class DisciplinePage {
  constructor(readonly page: Page) {}

  get newDiscipline() {
    return this.page.getByRole("button", {
      name: "New discipline",
      exact: true,
    });
  }
  get disciplineDialog() {
    return this.page.getByRole("dialog", {
      name: "New discipline",
      exact: true,
    });
  }
  get disciplineName() {
    return this.disciplineDialog.getByRole("textbox", {
      name: /^Name\*?$/,
      exact: true,
    });
  }
  get disciplineDescription() {
    return this.disciplineDialog.getByRole("textbox", {
      name: "Description",
      exact: true,
    });
  }
  get createDiscipline() {
    return this.disciplineDialog.getByRole("button", {
      name: "Create discipline",
      exact: true,
    });
  }
  get addGoal() {
    return this.page.getByRole("button", {
      name: "Add goal",
      exact: true,
    });
  }
  get goalDialog() {
    return this.page.getByRole("dialog", {
      name: "New goal",
      exact: true,
    });
  }
  get goalName() {
    return this.goalDialog.getByRole("textbox", {
      name: /^Goal name\*?$/,
      exact: true,
    });
  }
  get goalDescription() {
    return this.goalDialog.getByRole("textbox", {
      name: "Description",
      exact: true,
    });
  }
  get saveGoal() {
    return this.goalDialog.getByRole("button", {
      name: "Add goal",
      exact: true,
    });
  }
  get exerciseDialog() {
    return this.page.getByRole("dialog", {
      name: "New exercise",
      exact: true,
    });
  }
  get exerciseName() {
    return this.exerciseDialog.getByRole("textbox", {
      name: /^Exercise name\*?$/,
      exact: true,
    });
  }
  get exerciseDescription() {
    return this.exerciseDialog.getByRole("textbox", {
      name: "Description",
      exact: true,
    });
  }
  get saveExercise() {
    return this.exerciseDialog.getByRole("button", {
      name: "Add exercise",
      exact: true,
    });
  }
  get assignToDog() {
    return this.page.getByRole("button", {
      name: "Assign to dog",
      exact: true,
    });
  }
  get assignDialog() {
    return this.page.getByRole("dialog", {
      name: "Assign to dog",
      exact: true,
    });
  }
  get continueAssignment() {
    return this.assignDialog.getByRole("button", {
      name: "Continue",
      exact: true,
    });
  }
  get submitAssignment() {
    return this.assignDialog.getByRole("button", {
      name: /^Assign 1 goal · 1 exercise$/,
    });
  }

  heading(name: string) {
    return this.page.getByRole("heading", { name, exact: true });
  }

  goal(name: string) {
    return this.page.getByRole("article", { name, exact: true });
  }

  exercise(goal: string, exercise: string) {
    return this.goal(goal).getByText(exercise, { exact: true });
  }

  assignmentDog(name: string) {
    return this.assignDialog.getByRole("radio", { name });
  }

  assignedDog(name: string) {
    return this.page
      .getByRole("region", { name: "Dogs with this discipline", exact: true })
      .getByText(name, { exact: true });
  }

  async create(name: string, description: string) {
    await this.newDiscipline.click();
    await this.disciplineName.fill(name);
    await this.disciplineDescription.fill(description);
    await this.createDiscipline.click();
    await expect(this.disciplineDialog).toBeHidden();
    await expect(this.heading(name)).toBeVisible();
  }

  async createGoal(name: string, description: string) {
    await this.addGoal.click();
    await this.goalName.fill(name);
    await this.goalDescription.fill(description);
    await this.saveGoal.click();
    await expect(this.goalDialog).toBeHidden();
    await expect(this.goal(name)).toBeVisible();
  }

  async createExercise(goal: string, name: string, description: string) {
    await this.goal(goal)
      .getByRole("button", { name: "Add exercise", exact: true })
      .click();
    await this.exerciseName.fill(name);
    await this.exerciseDescription.fill(description);
    await this.saveExercise.click();
    await expect(this.exerciseDialog).toBeHidden();
    await expect(this.exercise(goal, name)).toBeVisible();
  }

  async assign(dog: string) {
    await this.assignToDog.click();
    await this.assignmentDog(dog).press("Space");
    await this.continueAssignment.click();
    await this.submitAssignment.click();
    await expect(this.assignDialog).toBeHidden();
  }
}
