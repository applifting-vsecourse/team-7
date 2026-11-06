-- AlterTable
ALTER TABLE "exercise" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- Existing exercises keep the order they were shown in: by creation.
UPDATE "exercise" AS e
SET "position" = ordered.position
FROM (
  SELECT "id",
         ROW_NUMBER() OVER (PARTITION BY "goalId" ORDER BY "createdAt", "id") - 1 AS position
  FROM "exercise"
) AS ordered
WHERE e."id" = ordered."id";

-- DropIndex
DROP INDEX "exercise_goalId_idx";

-- CreateIndex
CREATE INDEX "exercise_goalId_position_idx" ON "exercise"("goalId", "position");
