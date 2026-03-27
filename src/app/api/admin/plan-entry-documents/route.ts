import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const maxDuration = 60;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function sanitizeFileName(name: string): string {
  const trimmed = name.trim().slice(0, 160);
  return trimmed.replace(/[^\w.\- ()äöüÄÖÜß]/g, "_");
}

const ALLOWED_MIME = new Set<string>(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
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
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let form: FormData;

  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Upload konnte nicht gelesen werden. Bitte Datei prüfen und erneut versuchen." },
      { status: 400 }
    );
  }

  const planEntryIdRaw = form.get("planEntryId");
  const titleRaw = form.get("title");
  const fileRaw = form.get("file");

  const planEntryId = getString(planEntryIdRaw);
  const title = (getString(titleRaw) ?? "Dokument").trim().slice(0, 80);

  if (!planEntryId) return NextResponse.json({ error: "planEntryId missing" }, { status: 400 });
  if (!(fileRaw instanceof File)) return NextResponse.json({ error: "file missing" }, { status: 400 });

  const mimeType = fileRaw.type;
  if (!ALLOWED_MIME.has(mimeType)) {
    return NextResponse.json({ error: "Dateityp nicht erlaubt (PDF/JPG/PNG/WEBP)." }, { status: 400 });
  }

  const sizeBytes = fileRaw.size;
  if (sizeBytes <= 0 || sizeBytes > MAX_BYTES) {
    return NextResponse.json({ error: "Datei zu groß (max. 15 MB)." }, { status: 400 });
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

  let data: Uint8Array<ArrayBuffer>;

  try {
    const ab = await fileRaw.arrayBuffer();
    const source = new Uint8Array(ab);
    const targetBuffer = new ArrayBuffer(source.byteLength);
    data = new Uint8Array(targetBuffer);
    data.set(source);
  } catch {
    return NextResponse.json(
      { error: "Datei konnte serverseitig nicht verarbeitet werden." },
      { status: 400 }
    );
  }

  const fileName = sanitizeFileName(fileRaw.name || "upload");

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
      uploadedBy: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ ok: true, document: created });
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