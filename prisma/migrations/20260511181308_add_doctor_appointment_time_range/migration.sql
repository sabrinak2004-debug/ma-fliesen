-- CreateEnum
CREATE TYPE "SickLeaveKind" AS ENUM ('SICK_LEAVE', 'DOCTOR_APPOINTMENT');

-- CreateEnum
CREATE TYPE "AbsenceTimeMode" AS ENUM ('FULL_DAY', 'TIME_RANGE');

-- AlterTable
ALTER TABLE "Absence" ADD COLUMN     "endTime" TIME,
ADD COLUMN     "paidMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sickLeaveKind" "SickLeaveKind",
ADD COLUMN     "startTime" TIME,
ADD COLUMN     "timeMode" "AbsenceTimeMode" NOT NULL DEFAULT 'FULL_DAY';

-- AlterTable
ALTER TABLE "AbsenceRequest" ADD COLUMN     "endTime" TIME,
ADD COLUMN     "paidMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sickLeaveKind" "SickLeaveKind",
ADD COLUMN     "startTime" TIME,
ADD COLUMN     "timeMode" "AbsenceTimeMode" NOT NULL DEFAULT 'FULL_DAY';

-- CreateIndex
CREATE INDEX "Absence_userId_absenceDate_timeMode_idx" ON "Absence"("userId", "absenceDate", "timeMode");
