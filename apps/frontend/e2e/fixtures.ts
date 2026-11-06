import { expect, test as base, type Response } from "@playwright/test";
import { randomUUID } from "node:crypto";
import process from "node:process";

import { AppPage } from "./pom/app.page";
import { CalendarPage } from "./pom/calendar.page";
import { DisciplinePage } from "./pom/discipline.page";
import { DogPage } from "./pom/dog.page";
import { LoginPage } from "./pom/login.page";

export const credentials = {
  email: process.env.E2E_USER_EMAIL ?? "caffeinatedduck@example.com",
  password: process.env.E2E_USER_PASSWORD ?? "password1",
};

type Fixtures = {
  login: LoginPage;
  app: AppPage;
  dog: DogPage;
  discipline: DisciplinePage;
  calendar: CalendarPage;
  training: { dog: string; discipline: string; goal: string; exercise: string };
};

export const test = base.extend<Fixtures>({
  login: async ({ page }, provide) => {
    await provide(new LoginPage(page));
  },
  app: async ({ page }, provide) => {
    await provide(new AppPage(page));
  },
  dog: async ({ page }, provide) => {
    await provide(new DogPage(page));
  },
  discipline: async ({ page }, provide) => {
    await provide(new DisciplinePage(page));
  },
  calendar: async ({ page }, provide) => {
    await provide(new CalendarPage(page));
  },
  training: async ({ page, login, app }, provide) => {
    const suffix = randomUUID();
    const names = {
      dog: `E2E dog ${suffix}`,
      discipline: `E2E discipline ${suffix}`,
      goal: `E2E goal ${suffix}`,
      exercise: `E2E exercise ${suffix}`,
    };
    // Capture only root resources created by this test. Use the real response
    // URL so cleanup works with both the dev proxy and CI's direct API URL.
    const created: Promise<string | undefined>[] = [];
    const capture = (response: Response) => {
      if (
        response.request().method() !== "POST" ||
        !response.ok() ||
        !/\/api\/(dogs|disciplines)$/.test(new URL(response.url()).pathname)
      ) {
        return;
      }
      created.push(
        response
          .json()
          .then((body: { id: string; name: string }) =>
            body.name === names.dog || body.name === names.discipline
              ? `${response.url()}/${body.id}`
              : undefined,
          ),
      );
    };
    page.on("response", capture);
    try {
      await login.signIn(credentials.email, credentials.password);
      await expect(app.overviewHeading).toBeVisible();
      await provide(names);
    } finally {
      page.off("response", capture);
      const urls = (await Promise.all(created)).filter(
        (url) => url !== undefined,
      );
      // Cascades remove this test's goals, exercises, assignments and events.
      for (const url of urls.reverse()) {
        const response = await page.request.delete(url);
        expect(
          response.ok(),
          `Cleanup failed: ${response.url()} (${response.status()})`,
        ).toBeTruthy();
      }
    }
  },
});

export { expect };
