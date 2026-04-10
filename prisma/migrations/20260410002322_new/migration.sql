-- AlterTable
ALTER TABLE "PlanEntry" ADD COLUMN     "activitySourceLanguage" "AppLanguage",
ADD COLUMN     "activityTranslations" JSONB,
ADD COLUMN     "locationSourceLanguage" "AppLanguage",
ADD COLUMN     "locationTranslations" JSONB;

-- AlterTable
ALTER TABLE "PlanEntryDocument" ADD COLUMN     "titleSourceLanguage" "AppLanguage",
ADD COLUMN     "titleTranslations" JSONB;

-- AlterTable
ALTER TABLE "WorkEntry" ADD COLUMN     "activitySourceLanguage" "AppLanguage",
ADD COLUMN     "activityTranslations" JSONB,
ADD COLUMN     "locationSourceLanguage" "AppLanguage",
ADD COLUMN     "locationTranslations" JSONB;
