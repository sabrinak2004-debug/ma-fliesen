import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[\r\n"]/g, "_");
}

function contentDispositionInline(fileName: string): string {
  const safe = sanitizeFileName(fileName);
  return `inline; filename="${safe}"`;
}

function contentDispositionAttachment(fileName: string): string {
  const safe = sanitizeFileName(fileName);
  return `attachment; filename="${safe}"`;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const disposition = url.searchParams.get("disposition");

  if (!id) {
    return NextResponse.json({ error: "id missing" }, { status: 400 });
  }

  const doc = await prisma.planEntryDocument.findUnique({
    where: { id },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      data: true,
      planEntry: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = session.role === "ADMIN";
  if (!isAdmin && doc.planEntry.userId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fileName = doc.fileName || "document";
  const contentDisposition =
    disposition === "attachment"
      ? contentDispositionAttachment(fileName)
      : contentDispositionInline(fileName);

  return new NextResponse(doc.data, {
    status: 200,
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(doc.sizeBytes),
      "Content-Disposition": contentDisposition,
      "Cache-Control": "private, max-age=0, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}