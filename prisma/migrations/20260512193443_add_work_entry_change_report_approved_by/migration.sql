-- AlterTable
ALTER TABLE "WorkEntryChangeReport" ADD COLUMN     "approvedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "WorkEntryChangeReport_approvedByUserId_createdAt_idx" ON "WorkEntryChangeReport"("approvedByUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "WorkEntryChangeReport" ADD CONSTRAINT "WorkEntryChangeReport_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
