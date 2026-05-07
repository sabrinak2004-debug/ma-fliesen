-- CreateEnum
CREATE TYPE "WorkEntryEditRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "WorkEntryEditRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workEntryId" TEXT NOT NULL,
    "requestedWorkDate" DATE NOT NULL,
    "requestedStartTime" TIME NOT NULL,
    "requestedEndTime" TIME NOT NULL,
    "requestedActivity" TEXT NOT NULL,
    "requestedLocation" TEXT NOT NULL,
    "requestedTravelMinutes" INTEGER NOT NULL DEFAULT 0,
    "requestedNoteEmployee" TEXT,
    "requestedActivitySourceLanguage" "AppLanguage",
    "requestedActivityTranslations" JSONB,
    "requestedLocationSourceLanguage" "AppLanguage",
    "requestedLocationTranslations" JSONB,
    "requestedNoteSourceLanguage" "AppLanguage",
    "requestedNoteTranslations" JSONB,
    "reason" TEXT NOT NULL,
    "reasonSourceLanguage" "AppLanguage",
    "reasonTranslations" JSONB,
    "status" "WorkEntryEditRequestStatus" NOT NULL DEFAULT 'PENDING',
    "noteAdmin" TEXT,
    "noteAdminSourceLanguage" "AppLanguage",
    "noteAdminTranslations" JSONB,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkEntryEditRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkEntryEditRequest_userId_status_idx" ON "WorkEntryEditRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "WorkEntryEditRequest_workEntryId_idx" ON "WorkEntryEditRequest"("workEntryId");

-- CreateIndex
CREATE INDEX "WorkEntryEditRequest_decidedById_idx" ON "WorkEntryEditRequest"("decidedById");

-- CreateIndex
CREATE INDEX "WorkEntryEditRequest_status_createdAt_idx" ON "WorkEntryEditRequest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "WorkEntryEditRequest" ADD CONSTRAINT "WorkEntryEditRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkEntryEditRequest" ADD CONSTRAINT "WorkEntryEditRequest_workEntryId_fkey" FOREIGN KEY ("workEntryId") REFERENCES "WorkEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkEntryEditRequest" ADD CONSTRAINT "WorkEntryEditRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
