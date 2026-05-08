-- CreateEnum
CREATE TYPE "MonthlyWorkEntryConfirmationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- AlterEnum
ALTER TYPE "TaskRequiredAction" ADD VALUE 'CONFIRM_MONTHLY_WORK_ENTRIES';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "dueAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MonthlyWorkEntryConfirmation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "MonthlyWorkEntryConfirmationStatus" NOT NULL DEFAULT 'PENDING',
    "confirmedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "rejectionReasonSourceLanguage" "AppLanguage",
    "rejectionReasonTranslations" JSONB,
    "confirmationText" TEXT,
    "confirmationTextSourceLanguage" "AppLanguage",
    "confirmationTextTranslations" JSONB,
    "entrySnapshot" JSONB NOT NULL,
    "requiredUntilAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyWorkEntryConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonthlyWorkEntryConfirmation_userId_status_idx" ON "MonthlyWorkEntryConfirmation"("userId", "status");

-- CreateIndex
CREATE INDEX "MonthlyWorkEntryConfirmation_year_month_idx" ON "MonthlyWorkEntryConfirmation"("year", "month");

-- CreateIndex
CREATE INDEX "MonthlyWorkEntryConfirmation_requiredUntilAt_idx" ON "MonthlyWorkEntryConfirmation"("requiredUntilAt");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyWorkEntryConfirmation_userId_year_month_key" ON "MonthlyWorkEntryConfirmation"("userId", "year", "month");

-- CreateIndex
CREATE INDEX "Task_dueAt_idx" ON "Task"("dueAt");

-- AddForeignKey
ALTER TABLE "MonthlyWorkEntryConfirmation" ADD CONSTRAINT "MonthlyWorkEntryConfirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
