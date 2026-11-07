import type { Page } from "@playwright/test";

/** The overview: dog filter, neglected-discipline warning and day columns. */
export class OverviewPage {
  constructor(readonly page: Page) {}

  get neglected() {
    return this.page.getByRole("region", {
      name: /^\d+ disciplines? ha(s|ve) no exercise this week$/,
    });
  }
  get loadError() {
    return this.page.getByText("Could not load the overview", {
      exact: false,
    });
  }
  get retry() {
    return this.page.getByRole("button", { name: "Try again", exact: true });
  }

  /** The warning row of a dog and discipline. */
  neglectedRow(dog: string, discipline: string) {
    return this.neglected
      .getByRole("listitem")
      .filter({ hasText: `${dog} · ${discipline}` });
  }

  scheduleNeglected(dog: string, discipline: string) {
    return this.page.getByRole("button", {
      name: `Schedule: ${dog} · ${discipline}`,
      exact: true,
    });
  }

  filterDog(name: string) {
    return this.page
      .getByRole("group", { name: "Filter by dog" })
      .getByRole("checkbox", { name, exact: true });
  }

  /** Narrows the overview to one dog, so other tests' dogs don't interfere. */
  async showOnly(dog: string) {
    await this.filterDog("All").press("Space");
    await this.filterDog(dog).press("Space");
  }
}
