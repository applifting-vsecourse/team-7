CREATE TABLE "scheduled_exercise" (
  "id" TEXT NOT NULL,
  "dogId" TEXT NOT NULL,
  "exerciseId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "durationMinutes" INTEGER NOT NULL CHECK ("durationMinutes" BETWEEN 1 AND 1440),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "scheduled_exercise_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "scheduled_exercise_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "dog"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "scheduled_exercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "scheduled_exercise_dogId_startsAt_idx" ON "scheduled_exercise"("dogId", "startsAt");
CREATE INDEX "scheduled_exercise_exerciseId_idx" ON "scheduled_exercise"("exerciseId");
