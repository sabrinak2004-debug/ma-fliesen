-- AlterTable
ALTER TABLE "WorkEntryChangeReport" ADD COLUMN     "reasonSourceLanguage" "AppLanguage",
ADD COLUMN     "reasonTranslations" JSONB;
