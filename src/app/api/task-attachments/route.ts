import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { TaskCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 8;

type AttachmentDTO = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
};

function isAllowedMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/") || mimeType === "application/pdf";
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 120) || "upload";
}

function getFormFiles(formData: FormData): File[] {
  return formData
    .getAll("files")
    .filter((value): value is File => value instanceof File);
}

function toAttachmentDTO(row: {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}): AttachmentDTO {
  return {
    id: row.id,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    url: `/api/task-attachments/${encodeURIComponent(row.id)}/file`,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json({ error: "Ungültige Upload-Daten." }, { status: 400 });
  }

  const taskIdValue = formData.get("taskId");
  const taskId = typeof taskIdValue === "string" ? taskIdValue.trim() : "";

  if (!taskId) {
    return NextResponse.json({ error: "Aufgabe fehlt." }, { status: 400 });
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      assignedToUserId: session.userId,
      assignedToUser: {
        companyId: session.companyId,
      },
      category: TaskCategory.GENERAL,
    },
    select: {
      id: true,
    },
  });

  if (!task) {
    return NextResponse.json(
      { error: "Aufgabe nicht gefunden oder Upload nicht erlaubt." },
      { status: 404 }
    );
  }

  const files = getFormFiles(formData);

  if (files.length === 0) {
    return NextResponse.json({ error: "Keine Datei ausgewählt." }, { status: 400 });
  }

  if (files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json(
      { error: `Es können maximal ${MAX_FILES_PER_REQUEST} Dateien gleichzeitig hochgeladen werden.` },
      { status: 400 }
    );
  }

  const uploadedRows: AttachmentDTO[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Die Datei „${file.name}“ ist größer als 8 MB.` },
        { status: 400 }
      );
    }

    const mimeType = file.type || "application/octet-stream";

    if (!isAllowedMimeType(mimeType)) {
      return NextResponse.json(
        { error: `Der Dateityp von „${file.name}“ ist nicht erlaubt.` },
        { status: 400 }
      );
    }

    const cleanFileName = sanitizeFileName(file.name);
    const blob = await put(
      `task-attachments/${session.companyId}/${taskId}/${cleanFileName}`,
      file,
      {
        access: "private",
        addRandomSuffix: true,
      }
    );

    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId,
        uploadedById: session.userId,
        fileName: cleanFileName,
        mimeType,
        sizeBytes: file.size,
        blobUrl: blob.url,
        blobPathname: blob.pathname,
      },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
      },
    });

    uploadedRows.push(toAttachmentDTO(attachment));
  }

  return NextResponse.json({ attachments: uploadedRows });
}