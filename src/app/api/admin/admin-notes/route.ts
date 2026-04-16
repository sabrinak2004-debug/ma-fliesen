import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/requireAdmin";
import { translateAllLanguages, type SupportedLang } from "@/lib/translate";

function parseYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

type PostBody = {
  id?: string;
  userId: string;
  workDate: string; // YYYY-MM-DD
  note: string; // darf auch leer sein (optional)
};

type TranslationMap = Partial<Record<SupportedLang, string>>;

function isTranslationMap(value: Prisma.JsonValue | null | undefined): value is TranslationMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return true;
}

function toSupportedLang(language: string | null | undefined): SupportedLang {
  if (
    language === "DE" ||
    language === "EN" ||
    language === "IT" ||
    language === "TR" ||
    language === "SQ" ||
    language === "KU" ||
    language === "RO"
  ) {
    return language;
  }

  return "DE";
}

function getTranslatedText(
  originalText: string | null | undefined,
  translations: Prisma.JsonValue | null | undefined,
  language: string | null | undefined
): string {
  const fallback = originalText ?? "";
  const targetLanguage = toSupportedLang(language);

  if (!isTranslationMap(translations)) {
    return fallback;
  }

  const translated = translations[targetLanguage];
  return typeof translated === "string" && translated.trim() ? translated : fallback;
}

function toPrismaNullableJsonInput(
  value: TranslationMap | null
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const adminUser = await prisma.appUser.findUnique({
    where: { id: admin.id },
    select: {
      language: true,
    },
  });

  const url = new URL(req.url);
  const weekStart = url.searchParams.get("weekStart");
  if (!weekStart) return NextResponse.json({ error: "weekStart missing" }, { status: 400 });

  const start = parseYMD(weekStart);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  const notes = await prisma.adminNote.findMany({
    where: {
      workDate: { gte: start, lt: end },
      user: {
        companyId: admin.companyId,
      },
    },
    include: { user: { select: { id: true, fullName: true } } },
    orderBy: [{ workDate: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    notes: notes.map((note) => ({
      ...note,
      note: getTranslatedText(
        note.note,
        note.noteTranslations,
        adminUser?.language ?? "DE"
      ),
    })),
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as Partial<PostBody>;
  const { id, userId, workDate, note } = body ?? {};

  if (!userId || !workDate) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const targetUser = await prisma.appUser.findFirst({
    where: {
      id: String(userId),
      companyId: admin.companyId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "Ungültiger Mitarbeiter" }, { status: 400 });
  }

  let noteSourceLanguage: SupportedLang | null = null;
  let noteTranslations: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
    Prisma.JsonNull;

  if (typeof note === "string" && note.trim()) {
    const translationResult = await translateAllLanguages(note);
    noteSourceLanguage = translationResult.sourceLanguage;
    noteTranslations = toPrismaNullableJsonInput(translationResult.translations);
  }

  const data = {
    userId: targetUser.id,
    workDate: parseYMD(String(workDate)),
    note: typeof note === "string" ? note : "",
    noteSourceLanguage,
    noteTranslations,
  };

  // Wenn id vorhanden -> Update
  if (id) {
    const existing = await prisma.adminNote.findFirst({
      where: {
        id: String(id),
        user: {
          companyId: admin.companyId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Notiz nicht gefunden" }, { status: 404 });
    }

    const saved = await prisma.adminNote.update({
      where: { id: existing.id },
      data: {
        note: data.note,
        noteSourceLanguage: data.noteSourceLanguage,
        noteTranslations: data.noteTranslations,
        workDate: data.workDate,
        userId: data.userId,
      },
    });
    return NextResponse.json({ ok: true, note: saved });
  }

  // Sonst: 1 Notiz pro (userId, workDate) -> Upsert über Unique
  const saved = await prisma.adminNote.upsert({
    where: {
      userId_workDate: {
        userId: data.userId,
        workDate: data.workDate,
      },
    },
    create: data,
    update: {
      note: data.note,
      noteSourceLanguage: data.noteSourceLanguage,
      noteTranslations: data.noteTranslations,
    },
  });

  return NextResponse.json({ ok: true, note: saved });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id missing" }, { status: 400 });

  const existing = await prisma.adminNote.findFirst({
    where: {
      id: String(id),
      user: {
        companyId: admin.companyId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Notiz nicht gefunden" }, { status: 404 });
  }

  await prisma.adminNote.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}