-- CreateTable
CREATE TABLE "WorkEntryAttachment" (
    "id" TEXT NOT NULL,
    "workEntryId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "blobPathname" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkEntryAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAttachment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "blobPathname" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkEntryAttachment_blobPathname_key" ON "WorkEntryAttachment"("blobPathname");

-- CreateIndex
CREATE INDEX "WorkEntryAttachment_workEntryId_idx" ON "WorkEntryAttachment"("workEntryId");

-- CreateIndex
CREATE INDEX "WorkEntryAttachment_uploadedById_idx" ON "WorkEntryAttachment"("uploadedById");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAttachment_blobPathname_key" ON "TaskAttachment"("blobPathname");

-- CreateIndex
CREATE INDEX "TaskAttachment_taskId_idx" ON "TaskAttachment"("taskId");

-- CreateIndex
CREATE INDEX "TaskAttachment_uploadedById_idx" ON "TaskAttachment"("uploadedById");

-- AddForeignKey
ALTER TABLE "WorkEntryAttachment" ADD CONSTRAINT "WorkEntryAttachment_workEntryId_fkey" FOREIGN KEY ("workEntryId") REFERENCES "WorkEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkEntryAttachment" ADD CONSTRAINT "WorkEntryAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAttachment" ADD CONSTRAINT "TaskAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAttachment" ADD CONSTRAINT "TaskAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
