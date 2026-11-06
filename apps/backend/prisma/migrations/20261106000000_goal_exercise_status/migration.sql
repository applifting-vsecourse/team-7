-- CreateEnum
CREATE TYPE "dog_goal_status" AS ENUM ('in_progress', 'paused', 'completed');

-- CreateEnum
CREATE TYPE "dog_exercise_status" AS ENUM ('in_progress', 'paused', 'mastered');

-- AlterTable: goals without completedAt were the only "not completed" state, i.e. in progress.
ALTER TABLE "dog_goal" ADD COLUMN "status" "dog_goal_status" NOT NULL DEFAULT 'in_progress';
UPDATE "dog_goal" SET "status" = 'completed' WHERE "completedAt" IS NOT NULL;
ALTER TABLE "dog_goal" ADD CONSTRAINT "dog_goal_completed_check"
  CHECK (("status" = 'completed') = ("completedAt" IS NOT NULL));

-- AlterTable
ALTER TABLE "dog_exercise" ADD COLUMN "status" "dog_exercise_status" NOT NULL DEFAULT 'in_progress';
