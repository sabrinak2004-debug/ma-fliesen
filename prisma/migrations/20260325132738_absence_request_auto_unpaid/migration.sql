-- AlterTable
ALTER TABLE "AbsenceRequest" ADD COLUMN     "autoUnpaidBecauseNoBalance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "compensationLockedBySystem" BOOLEAN NOT NULL DEFAULT false;
