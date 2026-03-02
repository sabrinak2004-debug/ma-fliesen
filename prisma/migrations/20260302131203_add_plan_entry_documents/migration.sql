-- CreateTable
CREATE TABLE "PlanEntryDocument" (
    "id" TEXT NOT NULL,
    "planEntryId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanEntryDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanEntryDocument_planEntryId_idx" ON "PlanEntryDocument"("planEntryId");

-- CreateIndex
CREATE INDEX "PlanEntryDocument_uploadedById_idx" ON "PlanEntryDocument"("uploadedById");

-- AddForeignKey
ALTER TABLE "PlanEntryDocument" ADD CONSTRAINT "PlanEntryDocument_planEntryId_fkey" FOREIGN KEY ("planEntryId") REFERENCES "PlanEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanEntryDocument" ADD CONSTRAINT "PlanEntryDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
