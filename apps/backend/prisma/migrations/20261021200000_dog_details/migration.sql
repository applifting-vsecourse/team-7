-- AlterTable
ALTER TABLE "dog" RENAME COLUMN "text" TO "name";
ALTER TABLE "dog" ADD COLUMN "breed" TEXT,
ADD COLUMN "birthDate" DATE;
