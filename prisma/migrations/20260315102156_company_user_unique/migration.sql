/*
  Warnings:

  - A unique constraint covering the columns `[companyId,fullName]` on the table `AppUser` will be added. If there are existing duplicate values, this will fail.
  - Made the column `companyId` on table `AppUser` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "AppUser_fullName_key";

-- AlterTable
ALTER TABLE "AppUser" ALTER COLUMN "companyId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_companyId_fullName_key" ON "AppUser"("companyId", "fullName");
