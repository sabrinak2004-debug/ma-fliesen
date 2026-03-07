/*
  Warnings:

  - A unique constraint covering the columns `[userId,absenceDate]` on the table `Absence` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AbsenceDayPortion" AS ENUM ('FULL_DAY', 'HALF_DAY');

-- DropIndex
DROP INDEX "Absence_userId_absenceDate_type_key";

-- AlterTable
ALTER TABLE "Absence" ADD COLUMN     "dayPortion" "AbsenceDayPortion" NOT NULL DEFAULT 'FULL_DAY';

-- AlterTable
ALTER TABLE "AbsenceRequest" ADD COLUMN     "dayPortion" "AbsenceDayPortion" NOT NULL DEFAULT 'FULL_DAY';

-- CreateIndex
CREATE INDEX "Absence_userId_absenceDate_idx" ON "Absence"("userId", "absenceDate");

-- CreateIndex
CREATE UNIQUE INDEX "Absence_userId_absenceDate_key" ON "Absence"("userId", "absenceDate");
