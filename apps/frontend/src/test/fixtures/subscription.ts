import type { Subscription } from "@/features/settings/api/subscriptionQueryOptions";

export function createPlusSubscription(
  overrides: Partial<Subscription> = {},
): Subscription {
  return {
    status: "active",
    isPlus: true,
    needsDogChoice: false,
    activeDogId: null,
    dogs: 1,
    goals: 0,
    billingPeriod: "yearly",
    trialUsed: true,
    paidUntil: "2099-12-01T00:00:00.000Z",
    trialEndsAt: null,
    retryAt: null,
    cardLast4: "4242",
    freeDogLimit: 1,
    ...overrides,
  };
}
