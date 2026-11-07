BEGIN;

ALTER TABLE "video" ADD COLUMN "slot" INTEGER;

-- Refuse existing groups above the limit rather than deleting user videos.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "video"
        WHERE "status" <> 'deleting' AND "dogId" IS NOT NULL AND "exerciseId" IS NOT NULL
        GROUP BY "dogId", "exerciseId"
        HAVING COUNT(*) > 3
    ) THEN
        RAISE EXCEPTION 'Cannot enforce video limit: remove excess videos from dog/exercise groups with more than 3 videos';
    END IF;
END $$;

WITH ranked AS (
    SELECT "id", ROW_NUMBER() OVER (
        PARTITION BY "dogId", "exerciseId" ORDER BY "created_at", "id"
    ) AS slot
    FROM "video"
    WHERE "status" <> 'deleting' AND "dogId" IS NOT NULL AND "exerciseId" IS NOT NULL
)
UPDATE "video" SET "slot" = ranked.slot FROM ranked WHERE "video"."id" = ranked."id";

-- Deleted and orphaned jobs only remain for storage cleanup.
UPDATE "video" SET "slot" = 1 WHERE "slot" IS NULL;
ALTER TABLE "video" ALTER COLUMN "slot" SET NOT NULL;
ALTER TABLE "video" ADD CONSTRAINT "video_slot_check" CHECK ("slot" BETWEEN 1 AND 3);

CREATE UNIQUE INDEX "video_dogId_exerciseId_slot_key"
    ON "video" ("dogId", "exerciseId", "slot") WHERE "status" <> 'deleting';

COMMIT;
