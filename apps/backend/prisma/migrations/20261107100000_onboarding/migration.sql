-- CreateEnum
CREATE TYPE "onboarding_status" AS ENUM ('pending', 'active', 'dismissed', 'completed');

-- AlterTable: first-login tour (#72).
ALTER TABLE "user" ADD COLUMN "onboardingCardHidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "onboardingStatus" "onboarding_status" NOT NULL DEFAULT 'pending',
ADD COLUMN "onboardingStep" TEXT;

-- Existing users never see the tour.
UPDATE "user" SET "onboardingStatus" = 'completed';
