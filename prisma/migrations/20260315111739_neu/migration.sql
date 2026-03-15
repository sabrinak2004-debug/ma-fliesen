/*
  Warnings:

  - You are about to drop the column `companyId` on the `AppUser` table. All the data in the column will be lost.
  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[fullName]` on the table `AppUser` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "AppUser" DROP CONSTRAINT "AppUser_companyId_fkey";

-- DropIndex
DROP INDEX "AppUser_companyId_fullName_key";

-- DropIndex
DROP INDEX "AppUser_companyId_idx";

-- AlterTable
ALTER TABLE "AppUser" DROP COLUMN "companyId";

-- DropTable
DROP TABLE "Company";

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_fullName_key" ON "AppUser"("fullName");
