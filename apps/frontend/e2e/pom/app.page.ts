import type { Page } from "@playwright/test";

export class AppPage {
  constructor(readonly page: Page) {}

  get navigation() {
    return this.page.getByRole("navigation", {
      name: "Main navigation",
    });
  }
  get overviewLink() {
    return this.navigation.getByRole("link", {
      name: "Overview",
      exact: true,
    });
  }
  get calendarLink() {
    return this.navigation.getByRole("link", {
      name: "Calendar",
      exact: true,
    });
  }
  get disciplinesLink() {
    return this.navigation.getByRole("link", {
      name: "Disciplines",
      exact: true,
    });
  }
  get overviewHeading() {
    return this.page.getByRole("heading", {
      name: "Overview",
      exact: true,
    });
  }
  get weeklyStatsHeading() {
    return this.page.getByRole("heading", {
      name: "This week",
      exact: true,
    });
  }
  get userMenu() {
    return this.page.getByRole("button", { name: "User menu" });
  }
  get signOutItem() {
    return this.page.getByRole("menuitem", { name: "Sign out" });
  }
  get alerts() {
    return this.page.getByRole("alert");
  }

  async signOut() {
    await this.userMenu.click();
    await this.signOutItem.click();
  }
}
