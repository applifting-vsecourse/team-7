import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api-client";

const subscriptionSchema = z.object({
  status: z.enum(["free", "trial", "active", "cancelled", "pastDue"]),
  trialEndsAt: z.string().nullable(),
  paidUntil: z.string().nullable(),
  trialUsed: z.boolean(),
  retryAt: z.string().nullable(),
  cardLast4: z.string(),
  dogs: z.number(),
  goals: z.number(),
});

export type Subscription = z.infer<typeof subscriptionSchema>;
export type SubscriptionAction =
  | "trial"
  | "pay"
  | "failPayment"
  | "cancel"
  | "resume"
  | "changeCard";

export const subscriptionQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["subscription", userId],
    queryFn: async ({ signal }) =>
      subscriptionSchema.parse(
        await api.get("users/me/subscription", { signal }).json(),
      ),
  });

export async function updateSubscription(action: SubscriptionAction) {
  return subscriptionSchema.parse(
    await api.post("users/me/subscription", { json: { action } }).json(),
  );
}
