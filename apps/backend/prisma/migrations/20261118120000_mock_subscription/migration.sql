CREATE TABLE "subscription" (
  "userId" TEXT NOT NULL PRIMARY KEY,
  "trialEndsAt" TIMESTAMP(3),
  "paidUntil" TIMESTAMP(3),
  "cancelled" BOOLEAN NOT NULL DEFAULT false,
  "paymentFailed" BOOLEAN NOT NULL DEFAULT false,
  "cardLast4" TEXT NOT NULL DEFAULT '4242',
  CONSTRAINT "subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
