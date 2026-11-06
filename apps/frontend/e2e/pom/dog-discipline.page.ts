import { expect, type Page } from "@playwright/test";

/** A dog's discipline detail: its goals with their status. */
export class DogDisciplinePage {
  constructor(readonly page: Page) {}

  get pausedGoals() {
    return this.page.getByRole("button", { name: /^Paused goals \(\d+\)$/ });
  }
  get completedGoals() {
    return this.page.getByRole("button", { name: /^Completed goals \(\d+\)$/ });
  }
  get markComplete() {
    return this.page.getByRole("button", {
      name: "Mark as completed",
      exact: true,
    });
  }
  /** The error toast; other "Try again" buttons belong to failed loads. */
  get saveError() {
    return this.page.getByRole("alertdialog", {
      name: "Could not save the status.",
    });
  }
  get retry() {
    return this.saveError.getByRole("button", {
      name: "Try again",
      exact: true,
    });
  }

  goal(name: string) {
    return this.page.getByRole("article", { name, exact: true });
  }

  toast(title: string) {
    return this.page.getByText(title, { exact: true });
  }

  /** Opens the dog's discipline from its profile. */
  async open(dogUrl: string, discipline: string) {
    await this.page.goto(dogUrl);
    await this.page.getByRole("link", { name: discipline }).click();
    await expect(
      this.page.getByRole("heading", { level: 1, name: discipline }),
    ).toBeVisible();
  }

  /** Picks a status item, e.g. "Pause goal", from the goal's ⋮ menu. */
  async goalAction(goal: string, action: string) {
    await this.goal(goal)
      .getByRole("button", { name: `More actions for goal ${goal}` })
      .click();
    await this.page
      .getByRole("menuitem", { name: new RegExp(`^${action}`) })
      .click();
  }
}
