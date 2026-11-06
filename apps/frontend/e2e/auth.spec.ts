import { credentials, expect, test } from "./fixtures";

test("sign-in defaults to Czech and validates required fields", async ({
  login,
}) => {
  await login.goto("cs");
  await expect(login.czechHeading).toBeVisible();
  await login.czechSubmit.click();
  await expect(login.emailRequired).toBeVisible();
  await expect(login.passwordRequired).toBeVisible();
});

test("a protected route redirects to sign-in", async ({ page, login, app }) => {
  await page.goto("/calendar?lng=en");
  await expect(page).toHaveURL(/\/login\?/);
  await expect(login.heading).toBeVisible();
  await expect(app.userMenu).toHaveCount(0);
});

test("invalid credentials keep the user on sign-in", async ({
  page,
  login,
  app,
}) => {
  await login.signIn(credentials.email, "incorrect-password");
  await expect(login.invalidCredentials).toBeVisible();
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(app.userMenu).toHaveCount(0);
});

test("sign in, load training data, retain the session, and sign out", async ({
  page,
  login,
  app,
  calendar,
}) => {
  await login.signIn(credentials.email, credentials.password);
  await expect(page).toHaveURL(/\/overview(?:\?|$)/);
  await expect(app.overviewHeading).toBeVisible();
  await expect(app.weeklyStatsHeading).toBeVisible();

  await app.calendarLink.click();
  await expect(page).toHaveURL(/\/calendar(?:\?|$)/);
  await expect(calendar.weeklyHeading).toBeVisible();
  await expect(app.alerts).toHaveCount(0);
  expect(new URL(page.url()).searchParams.get("lng")).toBe("en");

  await page.reload();
  await expect(calendar.heading).toBeVisible();
  await app.signOut();
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await page.goto("/overview?lng=en");
  await expect(page).toHaveURL(/\/login\?/);
  await expect(login.heading).toBeVisible();
});
