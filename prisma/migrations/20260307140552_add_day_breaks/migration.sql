-- CreateTable
CREATE TABLE "DayBreak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "breakStartHHMM" TEXT,
    "breakEndHHMM" TEXT,
    "manualMinutes" INTEGER NOT NULL DEFAULT 0,
    "legalMinutes" INTEGER NOT NULL DEFAULT 0,
    "autoSupplementMinutes" INTEGER NOT NULL DEFAULT 0,
    "effectiveMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DayBreak_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DayBreak_userId_workDate_idx" ON "DayBreak"("userId", "workDate");

-- CreateIndex
CREATE UNIQUE INDEX "DayBreak_userId_workDate_key" ON "DayBreak"("userId", "workDate");

-- AddForeignKey
ALTER TABLE "DayBreak" ADD CONSTRAINT "DayBreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
