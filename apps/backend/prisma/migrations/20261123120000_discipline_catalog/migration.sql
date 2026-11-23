-- Disciplines get a catalog category and the catalog discipline they were
-- copied from (F-63).

-- AlterTable
ALTER TABLE "discipline" ADD COLUMN     "catalogKey" TEXT,
ADD COLUMN     "category" TEXT;

-- The former default disciplines (#72) become copies of their catalog
-- discipline, matched by their Czech or English name; only the oldest one per
-- user and key, so the unique index below holds.
UPDATE "discipline" d
SET "catalogKey" = m.key, "category" = m.category
FROM (
  SELECT DISTINCT ON (x."userId", defaults.key) x.id, defaults.key, defaults.category
  FROM "discipline" x
  JOIN (VALUES
    ('obedience', 'everyday', 'Základy poslušnosti', 'Obedience basics'),
    ('recall', 'everyday', 'Spolehlivé přivolání', 'Reliable recall'),
    ('nosework', 'scent', 'Nosework – začátky', 'Nosework – first steps'),
    ('agility', 'agility-sports', 'Agility – základy', 'Agility – basics'),
    ('canicross', 'mushing', 'Canicross – začátky', 'Canicross – first steps')
  ) AS defaults(key, category, cs, en)
    ON lower(x."name") IN (lower(defaults.cs), lower(defaults.en))
  ORDER BY x."userId", defaults.key, x."createdAt", x.id
) m
WHERE d.id = m.id;

-- CreateIndex
CREATE UNIQUE INDEX "discipline_userId_catalogKey_key" ON "discipline"("userId", "catalogKey");
