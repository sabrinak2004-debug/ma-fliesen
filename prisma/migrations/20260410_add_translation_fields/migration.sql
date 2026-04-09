ALTER TABLE "AbsenceRequest"
  ADD COLUMN "noteEmployeeSourceLanguage" "AppLanguage",
  ADD COLUMN "noteEmployeeTranslations" JSONB;

ALTER TABLE "AdminNote"
  ADD COLUMN "noteSourceLanguage" "AppLanguage",
  ADD COLUMN "noteTranslations" JSONB;

ALTER TABLE "CalendarEvent"
  ADD COLUMN "titleSourceLanguage" "AppLanguage",
  ADD COLUMN "titleTranslations" JSONB,
  ADD COLUMN "locationSourceLanguage" "AppLanguage",
  ADD COLUMN "locationTranslations" JSONB,
  ADD COLUMN "notesSourceLanguage" "AppLanguage",
  ADD COLUMN "notesTranslations" JSONB;

ALTER TABLE "PlanEntry"
  ADD COLUMN "noteEmployeeSourceLanguage" "AppLanguage",
  ADD COLUMN "noteEmployeeTranslations" JSONB,
  ADD COLUMN "noteAdminSourceLanguage" "AppLanguage",
  ADD COLUMN "noteAdminTranslations" JSONB;

ALTER TABLE "Task"
  ADD COLUMN "titleSourceLanguage" "AppLanguage",
  ADD COLUMN "titleTranslations" JSONB,
  ADD COLUMN "descriptionSourceLanguage" "AppLanguage",
  ADD COLUMN "descriptionTranslations" JSONB;

ALTER TABLE "TimeEntryCorrectionRequest"
  ADD COLUMN "noteEmployeeSourceLanguage" "AppLanguage",
  ADD COLUMN "noteEmployeeTranslations" JSONB,
  ADD COLUMN "noteAdminSourceLanguage" "AppLanguage",
  ADD COLUMN "noteAdminTranslations" JSONB;