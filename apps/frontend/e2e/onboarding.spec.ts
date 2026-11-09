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

// The tests change the same user's tour, so they run one after the other.
// Only within one run of this file: --repeat-each runs copies side by side.
test.describe.configure({ mode: "serial" });

/** Ends the tour (also one a failed run left running), or fails loudly. */
async function finishTour(page: Page) {
  const response = await page.request.patch("/api/onboarding", {
    data: finished,
  });
  expect(response.ok(), `Ending the tour failed (${response.status()})`).toBe(
    true,
  );
}

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
      // A dog or an own discipline created by the test.
      !/\/api\/(dogs|dogs\/[^/]+\/disciplines)$/.test(pathname)
    ) {
      return;
    }
    const { id, name } = (await response.json()) as {
      id: string;
      name: string;
    };
    if (pathname.endsWith("/api/dogs") && name !== dogName) return;
    cleanup.push(
      pathname.endsWith("/api/dogs")
        ? `${response.url()}/${id}`
        : new URL(`/api/disciplines/${id}`, response.url()).href,
    );
  });
  try {
    await login.signIn(credentials.email, credentials.password);
    await expect(page).toHaveURL(/\/(overview|dogs|calendar)/);
    await finishTour(page);
    // The tour assigns a default discipline (added by a migration and to
    // every new account): an old database without it can't run this spec.
    const library = (await (
      await page.request.get("/api/disciplines")
    ).json()) as {
      name: string;
    }[];
    expect(
      library.map(({ name }) => name),
      "Default disciplines missing: run `pnpm backend prisma:migrations:run`",
    ).toContain("Spolehlivé přivolání");
    await page.goto("/overview?lng=en");
    await expect(app.overviewHeading).toBeVisible();
    await run();
  } finally {
    await finishTour(page);
    for (const url of cleanup.reverse()) {
      const response = await page.request.delete(url);
      expect(response.ok(), `Cleanup failed: ${url}`).toBeTruthy();
    }
  }
}

test("the guide walks through a dog, a default discipline and the first exercise", async ({
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
      // Pressing the highlighted button shrinks it a little; the bubble must
      // stay put instead of being re-created (it flickered).
      const bubble = await addDog.elementHandle();
      await dog.addDog.hover();
      await page.mouse.down();
      // A fixed wait on purpose: nothing to wait for, only a re-render to rule out.
      await page.waitForTimeout(300);
      expect(await bubble!.evaluate((element) => element.isConnected)).toBe(
        true,
      );
      await page.mouse.up();
      await expect(dog.dialog).toBeVisible();
      await dog.dialog
        .getByRole("button", { name: "Cancel", exact: true })
        .click();
      await expect(tour.bubble("Add a dog")).toBeVisible();
      await dog.create(dogName);
      const profile = await tour.expectBubble(
        `${dogName} is in`,
        "Step 2 of 7",
      );
      // The next step confirms the action instead of a toast (checked once
      // the step is there: the toast would have come with the saved dog).
      await expect(page.getByText(`${dogName} was added`)).toHaveCount(0);
      // The dimming stays between steps; removing it made the screen blink.
      await page.evaluate(() => {
        const w = window as Window & { overlayRemovals?: number };
        w.overlayRemovals = 0;
        new MutationObserver((records) => {
          for (const record of records) {
            for (const node of record.removedNodes) {
              if (node instanceof HTMLElement && node.matches(".bg-backdrop")) {
                w.overlayRemovals! += 1;
              }
            }
          }
        }).observe(document.body, { childList: true });
      });
      await tour.button(profile, "Next").click();
    });

    await test.step("Assign a default discipline from the library (O4, O5)", async () => {
      await tour.expectBubble("Assign a discipline", "Step 3 of 7");
      expect(
        await page.evaluate(
          () =>
            (window as Window & { overlayRemovals?: number }).overlayRemovals,
        ),
      ).toBe(0);
      await page
        .getByRole("button", { name: "Assign discipline", exact: true })
        .click();
      const dialog = tour.disciplineDialog;
      await dialog
        // Every account starts with the default disciplines; test accounts
        // got the Czech ones.
        .getByRole("radio", { name: "Spolehlivé přivolání", exact: true })
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
        .schedulingExercise("Na jméno z vedlejší místnosti")
        .press("Space");
      await calendar.continueScheduling.click();
      await expect(calendar.date).not.toHaveValue("");
      // Next week: the guide has to move the calendar to find the exercise.
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const date = [
        nextWeek.getFullYear(),
        String(nextWeek.getMonth() + 1).padStart(2, "0"),
        String(nextWeek.getDate()).padStart(2, "0"),
      ].join("-");
      await calendar.date.fill(date);
      await calendar.start.fill("12:00");
      await calendar.schedule.click();
      await expect(calendar.scheduleDialog).toBeHidden();
      await expect(page).toHaveURL(new RegExp(`date=${date}`));
    });

    await test.step("Finish in the weekly calendar (O8, O9)", async () => {
      const event = await tour.expectBubble(
        "Exercises are planned",
        "Step 6 of 7",
      );
      // The highlighted tile is the planned exercise, on screen and ringed.
      const tile = page.getByRole("article", {
        name: "Na jméno z vedlejší místnosti",
      });
      await expect(tile).toBeInViewport();
      const ring = page.locator(".animate-spotlight");
      await expect(ring).toBeVisible();
      // The ring settles 6px around the tile (after its own animation).
      await expect
        .poll(async () => {
          const [tileBox, ringBox] = await Promise.all([
            tile.boundingBox(),
            ring.boundingBox(),
          ]);
          return Math.max(
            Math.abs(ringBox!.x - (tileBox!.x - 6)),
            Math.abs(ringBox!.y - (tileBox!.y - 6)),
          );
        })
        .toBeLessThan(3);
      await tour.button(event, "Next").click();
      const views = await tour.expectBubble("Day, week, month", "Step 7 of 7");
      await tour.button(views, "Finish").click();
      await expect(views).toBeHidden();
      // The dimming fades out and is removed; nothing is left over the app.
      await expect(page.locator(".bg-backdrop")).toHaveCount(0);
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
    // Scrolled away, the guide brings its target back on screen.
    const assign = page.getByRole("button", {
      name: "Assign discipline",
      exact: true,
    });
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await expect(assign).toBeInViewport();
    await assign.click();
    await expect(tour.disciplineDialog).toBeVisible();
    await tour.disciplineDialog
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
  });
});

test("an own discipline asks for a goal and an exercise before the calendar", async ({
  page,
  login,
  app,
  dog,
}) => {
  test.setTimeout(60_000);
  const tour = new OnboardingPage(page);
  const dogName = `E2E tour dog ${randomUUID()}`;
  await asTourUser({ page, login, app }, dogName, async () => {
    await app.userMenu.click();
    await tour.startItem.click();
    const welcome = await tour.expectBubble("Welcome to TrainLoop", "Guide");
    await tour.button(welcome, "Start").click();
    await dog.create(dogName);
    const profile = await tour.expectBubble(`${dogName} is in`, "Step 2 of 7");
    await tour.button(profile, "Next").click();

    await page
      .getByRole("button", { name: "Assign discipline", exact: true })
      .click();
    await tour.disciplineDialog
      .getByRole("radio", { name: "Your own discipline", exact: true })
      .press("Space");
    await tour.disciplineDialog
      .getByRole("button", { name: "Continue", exact: true })
      .click();
    const create = page.getByRole("dialog", {
      name: `New discipline for ${dogName}`,
    });
    await create
      .getByRole("textbox", { name: /^Name/ })
      .fill(`E2E own discipline ${randomUUID()}`);
    await create
      .getByRole("button", { name: "Create and add goals", exact: true })
      .click();

    // Still step 3 on the empty discipline: first a goal…
    await tour.expectBubble("Add a goal and an exercise", "Step 3 of 7");
    await page.getByRole("button", { name: "Add goal", exact: true }).click();
    const goal = page.getByRole("dialog", { name: "New goal", exact: true });
    await goal.getByRole("textbox", { name: /^Goal name/ }).fill("Recall");
    await goal.getByRole("button", { name: "Save", exact: true }).click();
    await expect(goal).toBeHidden();

    // …then its first exercise, after which the guide moves on.
    await tour.expectBubble("Add an exercise", "Step 3 of 7");
    await page
      .getByRole("button", { name: "Add exercise", exact: true })
      .click();
    const exercise = page.getByRole("dialog", {
      name: "New exercise",
      exact: true,
    });
    await exercise
      .getByRole("textbox", { name: /^Exercise name/ })
      .fill("Recall from 5 m");
    await exercise.getByRole("button", { name: "Save", exact: true }).click();
    await expect(exercise).toBeHidden();
    await tour.expectBubble("Discipline assigned", "Step 4 of 7");
  });
});
