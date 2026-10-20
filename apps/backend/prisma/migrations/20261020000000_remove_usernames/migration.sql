DROP INDEX "user_username_key";

ALTER TABLE "user"
DROP COLUMN "username",
DROP COLUMN "displayUsername";
