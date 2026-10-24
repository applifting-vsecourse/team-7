ALTER TABLE "dog" ADD COLUMN "archivedAt" TIMESTAMP(3);
CREATE TABLE "dog_discipline" (
  "dogId" TEXT NOT NULL,
  "disciplineId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dog_discipline_pkey" PRIMARY KEY ("dogId", "disciplineId"),
  CONSTRAINT "dog_discipline_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "dog"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "dog_discipline_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "discipline"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "dog_discipline_disciplineId_idx" ON "dog_discipline"("disciplineId");
INSERT INTO "dog_discipline" ("dogId", "disciplineId")
SELECT DISTINCT dg."dogId", g."disciplineId" FROM "dog_goal" dg JOIN "goal" g ON g."id" = dg."goalId";
