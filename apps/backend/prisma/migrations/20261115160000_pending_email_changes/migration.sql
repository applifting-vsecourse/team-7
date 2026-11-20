CREATE TABLE "pending_email_change" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "originalEmail" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "authToken" TEXT NOT NULL,
    "callbackUrl" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pending_email_change_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pending_email_change_userId_key" ON "pending_email_change"("userId");
CREATE UNIQUE INDEX "pending_email_change_tokenHash_key" ON "pending_email_change"("tokenHash");
ALTER TABLE "pending_email_change" ADD CONSTRAINT "pending_email_change_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
