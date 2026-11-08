import type { AppPage } from "./pom/app.page";
import type { LoginPage } from "./pom/login.page";
import type { Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import process from "node:process";

import { expect, test } from "./fixtures";
import { OnboardingPage } from "./pom/onboarding.page";

// The tour state belongs to the user, so this spec uses its own seed account:
// a running tour would dim every page of the specs that share the default one.
const credentials = {
  email: process.env.E2E_ONBOARDING_EMAIL ?? "deepduckthoughts@example.com",
  password: process.env.E2E_ONBOARDING_PASSWORD ?? "password2",
};

const finished = { status: "completed", step: null };

// Both tests change the same user's tour, so they run one after the other.
test.describe.configure({ mode: "serial" });

/**
 * Signs in the tour user, runs the test and removes the dog and the copied
 * discipline it created, leaving the tour finished.
 */
async function asTourUser(
  { page, login, app }: { page: Page; login: LoginPage; app: AppPage },
  dogName: string,
  run: () => Promise<void>,
) {
  const cleanup: string[] = [];
  page.on("response", async (response) => {
    const { pathname } = new URL(response.url());
    if (
      response.request().method() !== "POST" ||
      !response.ok() ||
      !/\/api\/(dogs|onboarding\/catalog\/[^/]+)$/.test(pathname)
    ) {
      return;
    }
    const { id, name } = (await response.json()) as {
      id: string;
      name: string;
    };
    if (pathname.endsWith("/dogs") && name !== dogName) return;
    cleanup.push(
      pathname.endsWith("/dogs")
        ? `${response.url()}/${id}`
        : response
            .url()
            .replace(/onboarding\/catalog\/[^/]+$/, `disciplines/${id}`),
    );
  });
  try {
    await login.signIn(credentials.email, credentials.password);
    await expect(page).toHaveURL(/\/(overview|dogs|calendar)/);
    // A run that failed mid-tour leaves it running for this user.
    await page.request.patch("/api/onboarding", { data: finished });
    await page.goto("/overview?lng=en");
    await expect(app.overviewHeading).toBeVisible();
    await run();
  } finally {
    await page.request.patch("/api/onboarding", { data: finished });
    for (const url of cleanup.reverse()) {
      const response = await page.request.delete(url);
      expect(response.ok(), `Cleanup failed: ${url}`).toBeTruthy();
    }
  }
}

test("the guide walks through a dog, a prefilled discipline and the first exercise", async ({
  page,
  login,
  app,
  dog,
  calendar,
}) => {
  // The whole tour across three pages, plus cleanup.
  test.setTimeout(90_000);
  const tour = new OnboardingPage(page);
  const dogName = `E2E tour dog ${randomUUID()}`;
  await asTourUser({ page, login, app }, dogName, async () => {
    await test.step("Start the guide from the user menu (O13, O1)", async () => {
      await app.userMenu.click();
      await tour.startItem.click();
      const welcome = await tour.expectBubble("Welcome to TrainLoop", "Guide");
      await tour.button(welcome, "Start").click();
    });

    await test.step("Add a dog through the highlighted button (O2, O3)", async () => {
      const addDog = await tour.expectBubble("Add a dog", "Step 1 of 7");
      // An action step has no Next: the user uses the highlighted element.
      await expect(tour.button(addDog, "Next")).toHaveCount(0);
      await dog.create(dogName);
      // The next step confirms the action instead of a toast.
      await expect(page.getByText(`${dogName} was added`)).toHaveCount(0);
      const profile = await tour.expectBubble(
        `${dogName} is in`,
        "Step 2 of 7",
      );
      await tour.button(profile, "Next").click();
    });

    await test.step("Copy a prefilled discipline to the dog (O4, O5)", async () => {
      await tour.expectBubble("Assign a discipline", "Step 3 of 7");
      await page
        .getByRole("button", { name: "Assign discipline", exact: true })
        .click();
      const dialog = tour.catalogDialog;
      await dialog
        .getByRole("radio", { name: "Reliable recall", exact: true })
        .press("Space");
      await dialog
        .getByRole("button", { name: "Continue", exact: true })
        .click();
      await dialog
        .getByRole("button", { name: "Select all", exact: true })
        .click();
      await dialog.getByRole("button", { name: /^Assign / }).click();
      await expect(dialog).toBeHidden();
    });

    await test.step("Open the calendar and plan the first exercise (O6, O7)", async () => {
      await tour.expectBubble("Discipline assigned", "Step 4 of 7");
      await app.calendarLink.click();
      await tour.expectBubble("Plan an exercise", "Step 5 of 7");
      await calendar.scheduleExercise.click();
      // The tour's dog and discipline are already selected.
      await calendar
        .schedulingExercise("On name from the next room")
        .press("Space");
      await calendar.continueScheduling.click();
      await expect(calendar.date).not.toHaveValue("");
      await calendar.start.fill("12:00");
      await calendar.schedule.click();
      await expect(calendar.scheduleDialog).toBeHidden();
    });

    await test.step("Finish in the weekly calendar (O8, O9)", async () => {
      const event = await tour.expectBubble(
        "Exercises are planned",
        "Step 6 of 7",
      );
      await tour.button(event, "Next").click();
      const views = await tour.expectBubble("Day, week, month", "Step 7 of 7");
      await tour.button(views, "Finish").click();
      await expect(views).toBeHidden();
      await expect(calendar.weeklyHeading).toBeVisible();
      await page.reload();
      await expect(calendar.weeklyHeading).toBeVisible();
      await expect(tour.bubble("Day, week, month")).toHaveCount(0);
    });
  });
});

test("on a phone the menu closes once the guide moves to the dog's page", async ({
  page,
  login,
  app,
  dog,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const tour = new OnboardingPage(page);
  const dogName = `E2E tour dog ${randomUUID()}`;
  const menu = page.getByRole("dialog", {
    name: "Main navigation",
    exact: true,
  });
  await asTourUser({ page, login, app }, dogName, async () => {
    await app.userMenu.click();
    await tour.startItem.click();
    const welcome = await tour.expectBubble("Welcome to TrainLoop", "Guide");
    await tour.button(welcome, "Start").click();

    // O2 → O2b: the ☰ first, then Add dog inside the open menu.
    await tour.expectBubble("Open the menu", "Step 1 of 7");
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await expect(menu).toBeVisible();
    await tour.expectBubble("Add a dog", "Step 1 of 7");
    await dog.create(dogName);

    // O3 → O4 happen on the dog's page, so the menu must not cover it.
    const profile = await tour.expectBubble(`${dogName} is in`, "Step 2 of 7");
    await expect(menu).toBeHidden();
    await tour.button(profile, "Next").click();
    await tour.expectBubble("Assign a discipline", "Step 3 of 7");
    await page
      .getByRole("button", { name: "Assign discipline", exact: true })
      .click();
    await expect(tour.catalogDialog).toBeVisible();
    await tour.catalogDialog
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
  });
});
