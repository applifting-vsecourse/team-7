import { expect, test } from "@playwright/test";
import process from "node:process";

// The normal development seed creates and verifies this account. Tests only
// read its training data, so they can also run against a developer's local app.
const email = process.env.E2E_USER_EMAIL ?? "caffeinatedduck@example.com";
const password = process.env.E2E_USER_PASSWORD ?? "password1";

test("sign-in defaults to Czech and validates required fields", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Přihlášení", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Přihlásit se", exact: true }).click();
  await expect(page.getByText("Zadejte e-mail", { exact: true })).toBeVisible();
  await expect(page.getByText("Zadejte heslo", { exact: true })).toBeVisible();
});

test("a protected route redirects to sign-in", async ({ page }) => {
  await page.goto("/calendar?lng=en");
  await expect(page).toHaveURL(/\/login\?/);
  await expect(
    page.getByRole("heading", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "User menu" })).toHaveCount(0);
});

test("sign in, load training data, retain the session, and sign out", async ({
  page,
}) => {
  await page.goto("/login?lng=en");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page).toHaveURL(/\/overview(?:\?|$)/);
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "This week", exact: true }),
  ).toBeVisible();

  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Calendar", exact: true })
    .click();
  await expect(page).toHaveURL(/\/calendar(?:\?|$)/);
  await expect(
    page.getByRole("heading", { name: "Weekly overview", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Calendar", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "User menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login(?:\?|$)/);

  await page.goto("/overview?lng=en");
  await expect(page).toHaveURL(/\/login\?/);
  await expect(
    page.getByRole("heading", { name: "Sign in", exact: true }),
  ).toBeVisible();
});
