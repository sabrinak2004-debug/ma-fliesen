-- CreateEnum
CREATE TYPE "AbsenceRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "AbsenceRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "type" "AbsenceType" NOT NULL,
    "status" "AbsenceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "noteEmployee" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbsenceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AbsenceRequest_userId_status_type_idx" ON "AbsenceRequest"("userId", "status", "type");

-- CreateIndex
CREATE INDEX "AbsenceRequest_startDate_endDate_idx" ON "AbsenceRequest"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "AbsenceRequest_decidedById_idx" ON "AbsenceRequest"("decidedById");

-- AddForeignKey
ALTER TABLE "AbsenceRequest" ADD CONSTRAINT "AbsenceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceRequest" ADD CONSTRAINT "AbsenceRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
