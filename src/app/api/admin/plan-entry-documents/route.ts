import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function isFormDataFile(
  value: FormDataEntryValue | null
): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "name" in value &&
    "type" in value &&
    "size" in value
  );
}

function sanitizeFileName(name: string): string {
  const trimmed = name.trim().slice(0, 160);
  return trimmed.replace(/[^\w.\- ()äöüÄÖÜß]/g, "_");
}

function getFileExtension(fileName: string): string {
  const trimmed = fileName.trim();
  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot < 0) return "";
  return trimmed.slice(lastDot + 1).toLowerCase();
}

function isPdfSignature(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

function detectImageMimeType(file: File): string | null {
  const reported = file.type.trim().toLowerCase();
  const ext = getFileExtension(file.name);

  if (ALLOWED_IMAGE_MIME.has(reported)) {
    return reported;
  }

  if (ext === "jpg" || ext === "jpeg") {
    return "image/jpeg";
  }

  if (ext === "png") {
    return "image/png";
  }

  if (ext === "webp") {
    return "image/webp";
  }

  return null;
}
const ALLOWED_IMAGE_MIME = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const planEntryId = url.searchParams.get("planEntryId");
  if (!planEntryId) return NextResponse.json({ error: "planEntryId missing" }, { status: 400 });

  const entry = await prisma.planEntry.findUnique({
    where: { id: planEntryId },
    select: {
      id: true,
      user: {
        select: {
          companyId: true,
        },
      },
    },
  });

  if (!entry) {
    return NextResponse.json({ error: "PlanEntry not found" }, { status: 404 });
  }

  if (entry.user.companyId !== admin.companyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const docs = await prisma.planEntryDocument.findMany({
    where: { planEntryId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      planEntryId: true,
      title: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
      uploadedBy: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ ok: true, documents: docs });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const form = await req.formData();

    const planEntryIdRaw = form.get("planEntryId");
    const titleRaw = form.get("title");
    const fileRaw = form.get("file");

    const planEntryId = getString(planEntryIdRaw);
    const title = (getString(titleRaw) ?? "Dokument").trim().slice(0, 80);

    if (!planEntryId) {
      return NextResponse.json({ error: "planEntryId missing" }, { status: 400 });
    }

    if (!isFormDataFile(fileRaw)) {
      return NextResponse.json({ error: "file missing" }, { status: 400 });
    }

    const sizeBytes = fileRaw.size;
    if (sizeBytes <= 0 || sizeBytes > MAX_BYTES) {
      return NextResponse.json(
        { error: "Datei zu groß (max. 15 MB)." },
        { status: 400 }
      );
    }

    const ab = await fileRaw.arrayBuffer();
    const bytes = new Uint8Array(ab);
    const fileName = sanitizeFileName(fileRaw.name || "upload");
    const extension = getFileExtension(fileName);

    let mimeType: string | null = null;

    if (extension === "pdf" || isPdfSignature(bytes)) {
      mimeType = "application/pdf";
    } else {
      mimeType = detectImageMimeType(fileRaw);
    }

    if (!mimeType) {
      return NextResponse.json(
        { error: "Dateityp nicht erlaubt (PDF/JPG/PNG/WEBP)." },
        { status: 400 }
      );
    }

    const entry = await prisma.planEntry.findUnique({
      where: { id: planEntryId },
      select: {
        id: true,
        user: {
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "PlanEntry not found" }, { status: 404 });
    }

    if (entry.user.companyId !== admin.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = Buffer.from(ab);

    const created = await prisma.planEntryDocument.create({
      data: {
        planEntryId,
        uploadedById: admin.id,
        title: title.length ? title : "Dokument",
        fileName,
        mimeType,
        sizeBytes,
        data,
      },
      select: {
        id: true,
        planEntryId: true,
        title: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
        uploadedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, document: created });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unbekannter Fehler beim Upload.";

    return NextResponse.json(
      { error: `Upload fehlgeschlagen: ${message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id missing" }, { status: 400 });

  const doc = await prisma.planEntryDocument.findUnique({
    where: { id },
    select: {
      id: true,
      planEntry: {
        select: {
          user: {
            select: {
              companyId: true,
            },
          },
        },
      },
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (doc.planEntry.user.companyId !== admin.companyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.planEntryDocument.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}