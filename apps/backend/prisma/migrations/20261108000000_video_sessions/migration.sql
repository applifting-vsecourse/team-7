BEGIN;

ALTER TABLE "video" ADD COLUMN "sessionId" TEXT;
ALTER TABLE "video" ADD CONSTRAINT "video_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "scheduled_exercise"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Old uploads did not record a session. Only backfill unambiguous matches,
-- including soft-deleted sessions so deletion/undo does not change attribution.
-- Preserve ambiguous and unmatched videos unassigned for manual linking.
WITH single_session AS (
    SELECT "dogId", "exerciseId", MIN("id") AS "sessionId"
    FROM "scheduled_exercise"
    WHERE "kind" = 'exercise' AND "exerciseId" IS NOT NULL
    GROUP BY "dogId", "exerciseId"
    HAVING COUNT(*) = 1
)
UPDATE "video" AS v SET "sessionId" = s."sessionId"
FROM single_session AS s
WHERE v."dogId" = s."dogId" AND v."exerciseId" = s."exerciseId";

DROP INDEX "video_dogId_exerciseId_slot_key";
CREATE UNIQUE INDEX "video_sessionId_slot_key"
    ON "video" ("sessionId", "slot") WHERE "status" <> 'deleting';
CREATE INDEX "video_sessionId_created_at_idx" ON "video" ("sessionId", "created_at");

COMMIT;
