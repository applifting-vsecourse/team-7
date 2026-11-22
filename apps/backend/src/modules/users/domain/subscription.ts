export const subscriptionActions = [
  "trial",
  "pay",
  "failPayment",
  "cancel",
  "resume",
  "changeCard",
] as const;
export type SubscriptionAction = (typeof subscriptionActions)[number];
