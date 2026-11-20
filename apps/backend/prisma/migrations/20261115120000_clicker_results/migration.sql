ALTER TABLE "scheduled_exercise"
  ADD COLUMN "successfulAttempts" INTEGER,
  ADD COLUMN "totalAttempts" INTEGER,
  ADD COLUMN "elapsedSeconds" INTEGER;

ALTER TABLE "scheduled_exercise" ADD CONSTRAINT "scheduled_exercise_measurement_check" CHECK (
  ("successfulAttempts" IS NULL AND "totalAttempts" IS NULL AND "elapsedSeconds" IS NULL)
  OR ("kind" = 'exercise' AND "successfulAttempts" IS NOT NULL AND "totalAttempts" IS NOT NULL AND "elapsedSeconds" IS NOT NULL
    AND "successfulAttempts" >= 0 AND "successfulAttempts" <= "totalAttempts"
    AND "totalAttempts" <= 1000000 AND "elapsedSeconds" BETWEEN 0 AND 86400)
);
