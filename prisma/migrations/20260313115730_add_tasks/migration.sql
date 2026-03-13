-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('WORK_TIME', 'VACATION', 'SICKNESS', 'GENERAL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TaskRequiredAction" AS ENUM ('NONE', 'WORK_ENTRY_FOR_DATE', 'VACATION_ENTRY_FOR_DATE', 'SICK_ENTRY_FOR_DATE');

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "assignedToUserId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "completedByUserId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "TaskCategory" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "requiredAction" "TaskRequiredAction" NOT NULL DEFAULT 'NONE',
    "referenceDate" DATE,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_assignedToUserId_status_idx" ON "Task"("assignedToUserId", "status");

-- CreateIndex
CREATE INDEX "Task_assignedToUserId_category_status_idx" ON "Task"("assignedToUserId", "category", "status");

-- CreateIndex
CREATE INDEX "Task_createdByUserId_idx" ON "Task"("createdByUserId");

-- CreateIndex
CREATE INDEX "Task_completedByUserId_idx" ON "Task"("completedByUserId");

-- CreateIndex
CREATE INDEX "Task_referenceDate_idx" ON "Task"("referenceDate");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
