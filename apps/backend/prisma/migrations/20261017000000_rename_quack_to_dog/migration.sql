-- Rename the table without deleting its data or relations.
ALTER TABLE "quack" RENAME TO "dog";

-- Match Prisma's default constraint and index names for the renamed table.
ALTER TABLE "dog" RENAME CONSTRAINT "quack_pkey" TO "dog_pkey";
ALTER TABLE "dog" RENAME CONSTRAINT "quack_userId_fkey" TO "dog_userId_fkey";
ALTER INDEX "quack_userId_idx" RENAME TO "dog_userId_idx";
