/*
  Warnings:

  - The `noteEmployeeTranslations` column on the `WorkEntry` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "WorkEntry" ADD COLUMN     "noteEmployeeSourceLanguage" "AppLanguage",
DROP COLUMN "noteEmployeeTranslations",
ADD COLUMN     "noteEmployeeTranslations" JSONB;
