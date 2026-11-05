import { expect, type Page } from "@playwright/test";

export class DogPage {
  constructor(readonly page: Page) {}

  get addDog() {
    return this.page.getByRole("button", {
      name: "Add dog",
      exact: true,
    });
  }
  get dialog() {
    return this.page.getByRole("dialog", {
      name: "Add dog",
      exact: true,
    });
  }
  get name() {
    return this.dialog.getByRole("textbox", {
      name: /^Name\*?$/,
      exact: true,
    });
  }
  get breed() {
    return this.dialog.getByRole("textbox", {
      name: "Breed",
      exact: true,
    });
  }
  get submit() {
    return this.dialog.getByRole("button", {
      name: "Add dog",
      exact: true,
    });
  }
  get nameRequired() {
    return this.dialog.getByText("Enter the dog's name.", {
      exact: true,
    });
  }

  heading(name: string) {
    return this.page.getByRole("heading", { name, exact: true });
  }

  async create(name: string, breed = "Border Collie") {
    await this.addDog.click();
    await this.name.fill(name);
    await this.breed.fill(breed);
    await this.submit.click();
    await expect(this.dialog).toBeHidden();
    await expect(this.heading(name)).toBeVisible();
  }
}
