ALTER TABLE "subscription"
 ADD COLUMN "activeDogId" TEXT,
 ADD COLUMN "billingPeriod" TEXT NOT NULL DEFAULT 'yearly',
 ADD COLUMN "trialReminderSentAt" TIMESTAMP(3);
