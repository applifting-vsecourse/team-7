-- CreateEnum
CREATE TYPE "scheduled_exercise_kind" AS ENUM ('exercise', 'lesson');

-- AlterTable: a lesson with a trainer (#70) has no exercise, rating or note.
ALTER TABLE "scheduled_exercise" ADD COLUMN "kind" "scheduled_exercise_kind" NOT NULL DEFAULT 'exercise';
ALTER TABLE "scheduled_exercise" ALTER COLUMN "exerciseId" DROP NOT NULL;
ALTER TABLE "scheduled_exercise" ADD CONSTRAINT "scheduled_exercise_kind_check"
  CHECK (
    (("kind" = 'exercise') = ("exerciseId" IS NOT NULL))
    AND ("kind" = 'exercise' OR ("rating" IS NULL AND "note" IS NULL))
  );
