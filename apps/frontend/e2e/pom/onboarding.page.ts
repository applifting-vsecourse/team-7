import { expect, type Locator, type Page } from "@playwright/test";

/** The first-login tour (#72): its Coach Mark bubbles and the discipline dialog. */
export class OnboardingPage {
  constructor(readonly page: Page) {}

  get startItem() {
    return this.page.getByRole("menuitem", {
      name: "Start the guide",
      exact: true,
    });
  }
  /** O5: assign a discipline from the library or the catalog, or your own. */
  get disciplineDialog() {
    return this.page.getByRole("dialog", {
      name: "Assign discipline",
      exact: true,
    });
  }

  /** Expands a catalog category of the O5 dialog (by the start of its name)
   * unless the tour already opened it. */
  async openCatalogCategory(prefix: string) {
    const trigger = this.disciplineDialog.getByRole("button", {
      name: new RegExp(`^${prefix}`),
    });
    if ((await trigger.getAttribute("aria-expanded")) !== "true") {
      await trigger.click();
    }
  }

  /** The first exercise of the library copy of a catalog discipline. */
  async firstCatalogExercise(catalogKey: string) {
    const library = (await (
      await this.page.request.get("/api/disciplines")
    ).json()) as { id: string; catalogKey: string | null }[];
    const copy = library.find((item) => item.catalogKey === catalogKey);
    expect(copy, `No library copy of ${catalogKey}`).toBeDefined();
    const detail = (await (
      await this.page.request.get(`/api/disciplines/${copy!.id}`)
    ).json()) as { goals: { exercises: { name: string }[] }[] };
    return detail.goals[0]!.exercises[0]!.name;
  }

  bubble(title: string) {
    return this.page.getByRole("dialog", { name: title, exact: true });
  }

  button(bubble: Locator, name: string) {
    return bubble.getByRole("button", { name, exact: true });
  }

  /** The bubble is the kit's popover: an opaque surface, not bare text. */
  async expectBubble(title: string, step?: string) {
    const bubble = this.bubble(title);
    await expect(bubble).toBeVisible();
    if (step) {
      await expect(bubble.getByText(step, { exact: true })).toBeVisible();
    }
    const background = await bubble.evaluate(
      (element) =>
        getComputedStyle(element.closest(".popover") ?? element)
          .backgroundColor,
    );
    expect(background).not.toBe("rgba(0, 0, 0, 0)");
    return bubble;
  }
}
