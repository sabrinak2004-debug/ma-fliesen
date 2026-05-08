ALTER TABLE "Task" ADD COLUMN "completionNote" TEXT;
ALTER TABLE "Task" ADD COLUMN "completionNoteSourceLanguage" "AppLanguage";
ALTER TABLE "Task" ADD COLUMN "completionNoteTranslations" JSONB;