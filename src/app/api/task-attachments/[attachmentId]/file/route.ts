import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    attachmentId: string;
  }>;
};

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[\r\n"]/g, "_");
}

function contentDispositionInline(fileName: string): string {
  const safeFileName = sanitizeFileName(fileName);
  const encodedFileName = encodeURIComponent(fileName);

  return `inline; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`;
}

export async function GET(
  _req: Request,
  context: RouteContext
): Promise<Response> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const { attachmentId } = await context.params;

  const attachment = await prisma.taskAttachment.findFirst({
    where: {
      id: attachmentId,
      task: {
        assignedToUser: {
          companyId: session.companyId,
        },
        ...(session.role === Role.ADMIN ? {} : { assignedToUserId: session.userId }),
      },
    },
    select: {
      fileName: true,
      mimeType: true,
      blobPathname: true,
    },
  });

  if (!attachment) {
    return NextResponse.json({ error: "Datei nicht gefunden." }, { status: 404 });
  }

  const blobResult = await get(attachment.blobPathname, {
    access: "private",
  });

  if (!blobResult) {
    return NextResponse.json({ error: "Datei nicht gefunden." }, { status: 404 });
  }

  return new Response(blobResult.stream, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": contentDispositionInline(attachment.fileName),
      "Cache-Control": "private, max-age=300",
    },
  });
}