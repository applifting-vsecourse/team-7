import { expect, type APIRequestContext } from "@playwright/test";

/** Training scenarios require Plus because the seed account already has a dog. */
export async function ensurePlus(request: APIRequestContext) {
  const url = "http://localhost:4050/api/users/me/subscription";
  const response = await request.get(url);
  expect(response.ok(), "Load test account subscription").toBeTruthy();
  const subscription = (await response.json()) as { isPlus: boolean };
  if (subscription.isPlus) return false;

  // This endpoint simulates payment; it never charges a card.
  const upgrade = await request.post(url, {
    data: { action: "pay", billingPeriod: "yearly" },
  });
  expect(upgrade.ok(), "Enable Plus for the test account").toBeTruthy();
  expect(await upgrade.json()).toMatchObject({ isPlus: true });
  return true;
}
