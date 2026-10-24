ALTER TABLE "scheduled_exercise"
  ADD COLUMN "rating" INTEGER,
  ADD COLUMN "note" TEXT,
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "undoToken" TEXT,
  ADD COLUMN "undoState" JSONB,
  ADD CONSTRAINT "scheduled_exercise_rating_check" CHECK ("rating" BETWEEN 1 AND 5),
  ADD CONSTRAINT "scheduled_exercise_result_check" CHECK (("completedAt" IS NULL AND "rating" IS NULL) OR ("completedAt" IS NOT NULL AND "rating" IS NOT NULL));
