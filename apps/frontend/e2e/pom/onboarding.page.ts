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
  /** O5: assign a discipline from the library, or your own. */
  get disciplineDialog() {
    return this.page.getByRole("dialog", {
      name: "Assign discipline",
      exact: true,
    });
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
