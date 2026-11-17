-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Account_createdAt_idx" ON "Account"("createdAt" DESC);
