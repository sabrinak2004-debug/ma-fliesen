-- CreateEnum
CREATE TYPE "WorkEntryChangeAction" AS ENUM ('UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "WorkEntryChangeReport" (
    "id" TEXT NOT NULL,
    "workEntryId" TEXT,
    "targetUserId" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "action" "WorkEntryChangeAction" NOT NULL,
    "reason" TEXT NOT NULL,
    "oldValues" JSONB NOT NULL,
    "newValues" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkEntryChangeReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkEntryChangeReport_workEntryId_idx" ON "WorkEntryChangeReport"("workEntryId");

-- CreateIndex
CREATE INDEX "WorkEntryChangeReport_targetUserId_createdAt_idx" ON "WorkEntryChangeReport"("targetUserId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkEntryChangeReport_changedByUserId_createdAt_idx" ON "WorkEntryChangeReport"("changedByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkEntryChangeReport_action_idx" ON "WorkEntryChangeReport"("action");

-- AddForeignKey
ALTER TABLE "WorkEntryChangeReport" ADD CONSTRAINT "WorkEntryChangeReport_workEntryId_fkey" FOREIGN KEY ("workEntryId") REFERENCES "WorkEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkEntryChangeReport" ADD CONSTRAINT "WorkEntryChangeReport_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkEntryChangeReport" ADD CONSTRAINT "WorkEntryChangeReport_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
