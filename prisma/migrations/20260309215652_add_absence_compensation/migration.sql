-- CreateEnum
CREATE TYPE "AbsenceCompensation" AS ENUM ('PAID', 'UNPAID');

-- AlterTable
ALTER TABLE "Absence" ADD COLUMN     "compensation" "AbsenceCompensation" NOT NULL DEFAULT 'PAID';

-- AlterTable
ALTER TABLE "AbsenceRequest" ADD COLUMN     "compensation" "AbsenceCompensation" NOT NULL DEFAULT 'PAID';
