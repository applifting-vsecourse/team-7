import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";

export const subscriptionSchema = z.object({
  status: z.enum(["free", "trial", "active", "cancelled", "pastDue"]),
  trialEndsAt: z.string().nullable(),
  paidUntil: z.string().nullable(),
  trialUsed: z.boolean(),
  retryAt: z.string().nullable(),
  cardLast4: z.string(),
  dogs: z.number(),
  freeDogLimit: z.number().int().positive(),
  goals: z.number(),
  isPlus: z.boolean(),
  needsDogChoice: z.boolean(),
  activeDogId: z.string().nullable(),
  billingPeriod: z.enum(["yearly", "monthly"]),
});

export type Subscription = z.infer<typeof subscriptionSchema>;
export type SubscriptionAction =
  | "trial"
  | "pay"
  | "failPayment"
  | "cancel"
  | "resume"
  | "changeCard";

export const subscriptionQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["subscription", userId],
    enabled: Boolean(userId),
    refetchInterval: 30_000,
    queryFn: async ({ signal }) =>
      subscriptionSchema.parse(
        await api.get("users/me/subscription", { signal }).json(),
      ),
  });

export async function updateSubscription(
  action: SubscriptionAction,
  billingPeriod?: "yearly" | "monthly",
) {
  return subscriptionSchema.parse(
    await api
      .post("users/me/subscription", {
        json: { action, ...(billingPeriod ? { billingPeriod } : {}) },
      })
      .json(),
  );
}

export async function chooseActiveDog(dogId: string) {
  return subscriptionSchema.parse(
    await api
      .post("users/me/subscription/active-dog", { json: { dogId } })
      .json(),
  );
}

export const dogChoicesQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["subscriptionDogChoices", userId],
    enabled: Boolean(userId),
    queryFn: async ({ signal }) =>
      z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            breed: z.string().nullable(),
            avatarVersion: z.string().nullable(),
            unfinishedGoals: z.number(),
          }),
        )
        .parse(
          await api.get("users/me/subscription/dog-choices", { signal }).json(),
        ),
  });
