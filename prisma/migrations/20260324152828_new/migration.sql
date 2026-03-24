-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "referenceEndDate" DATE,
ADD COLUMN     "referenceStartDate" DATE;

-- CreateIndex
CREATE INDEX "Task_referenceStartDate_idx" ON "Task"("referenceStartDate");

-- CreateIndex
CREATE INDEX "Task_referenceEndDate_idx" ON "Task"("referenceEndDate");
