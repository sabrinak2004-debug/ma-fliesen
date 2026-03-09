-- CreateEnum
CREATE TYPE "TimeEntryCorrectionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "TimeEntryCorrectionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "TimeEntryCorrectionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "noteEmployee" TEXT,
    "noteAdmin" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntryCorrectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntryUnlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "requestId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntryUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimeEntryCorrectionRequest_userId_status_idx" ON "TimeEntryCorrectionRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "TimeEntryCorrectionRequest_startDate_endDate_idx" ON "TimeEntryCorrectionRequest"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "TimeEntryCorrectionRequest_decidedById_idx" ON "TimeEntryCorrectionRequest"("decidedById");

-- CreateIndex
CREATE INDEX "TimeEntryUnlock_userId_workDate_idx" ON "TimeEntryUnlock"("userId", "workDate");

-- CreateIndex
CREATE INDEX "TimeEntryUnlock_requestId_idx" ON "TimeEntryUnlock"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "TimeEntryUnlock_userId_workDate_key" ON "TimeEntryUnlock"("userId", "workDate");

-- AddForeignKey
ALTER TABLE "TimeEntryCorrectionRequest" ADD CONSTRAINT "TimeEntryCorrectionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntryCorrectionRequest" ADD CONSTRAINT "TimeEntryCorrectionRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntryUnlock" ADD CONSTRAINT "TimeEntryUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntryUnlock" ADD CONSTRAINT "TimeEntryUnlock_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "TimeEntryCorrectionRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
