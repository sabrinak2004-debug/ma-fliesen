/*
  Warnings:

  - A unique constraint covering the columns `[userId,absenceDate,type,dayPortion,compensation]` on the table `Absence` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Absence_userId_absenceDate_key";

-- AlterTable
ALTER TABLE "AbsenceRequest" ADD COLUMN     "paidVacationUnits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unpaidVacationUnits" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Absence_userId_absenceDate_type_dayPortion_compensation_key" ON "Absence"("userId", "absenceDate", "type", "dayPortion", "compensation");
