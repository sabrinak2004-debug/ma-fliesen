import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/requireAdmin";
import { translateAllLanguages, type SupportedLang } from "@/lib/translate";
import {
  ADMIN_WEEKLY_PLAN_UI_TEXTS,
  normalizeAppUiLanguage,
  translate,
  type AdminWeeklyPlanTextKey,
  type AppUiLanguage,
} from "@/lib/i18n";

function parseYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

type PostBody = {
  id?: string;
  userId: string;
  workDate: string; // YYYY-MM-DD
  startHHMM: string; // "07:00"
  endHHMM: string; // "16:00"
  activity: string;
  location?: string;
  travelMinutes?: number;

  // ✅ bleibt am PlanEntry:
  noteEmployee?: string;
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

function toAppUiLanguage(language: string | null | undefined): AppUiLanguage {
  return normalizeAppUiLanguage(language);
}

function tWeekly(
  language: string | null | undefined,
  key: AdminWeeklyPlanTextKey
): string {
  return translate(
    toAppUiLanguage(language),
    key,
    ADMIN_WEEKLY_PLAN_UI_TEXTS
  );
}

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminUser = await prisma.appUser.findUnique({
    where: { id: admin.id },
    select: {
      language: true,
    },
  });

  const url = new URL(req.url);
  const weekStart = url.searchParams.get("weekStart");

  if (!weekStart) {
    return NextResponse.json({ error: "weekStart missing" }, { status: 400 });
  }

  const start = parseYMD(weekStart);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  const entries = await prisma.planEntry.findMany({
    where: {
      workDate: { gte: start, lt: end },
      user: {
        companyId: admin.companyId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: [{ workDate: "asc" }, { startHHMM: "asc" }],
  });

  return NextResponse.json({
    entries: entries.map((entry) => ({
      ...entry,
      activity: getTranslatedText(
        entry.activity,
        entry.activityTranslations,
        adminUser?.language ?? "DE"
      ),
      location: getTranslatedText(
        entry.location,
        entry.locationTranslations,
        adminUser?.language ?? "DE"
      ),
      noteEmployee: getTranslatedText(
        entry.noteEmployee,
        entry.noteEmployeeTranslations,
        adminUser?.language ?? "DE"
      ),
    })),
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminUser = await prisma.appUser.findUnique({
    where: { id: admin.id },
    select: {
      language: true,
    },
  });

  const adminLanguage = adminUser?.language ?? "DE";

  const body = (await req.json()) as Partial<PostBody>;

  const { id, userId, workDate, startHHMM, endHHMM, activity, location, travelMinutes, noteEmployee } = body ?? {};

  // PlanEntry-Felder (Admin-Notiz ist NICHT mehr hier)
  if (!userId || !workDate || !startHHMM || !endHHMM || !activity) {
    return NextResponse.json(
      { error: tWeekly(adminLanguage, "pleaseSelectStartEnd") },
      { status: 400 }
    );
  }

  const targetUser = await prisma.appUser.findUnique({
    where: { id: String(userId) },
    select: {
      id: true,
      companyId: true,
      isActive: true,
      role: true,
    },
  });

  if (!targetUser || !targetUser.isActive) {
    return NextResponse.json(
      { error: tWeekly(adminLanguage, "pleaseSelectEmployee") },
      { status: 404 }
    );
  }

  if (targetUser.companyId !== admin.companyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (targetUser.role !== "EMPLOYEE") {
    return NextResponse.json(
      { error: tWeekly(adminLanguage, "pleaseSelectEmployee") },
      { status: 400 }
    );
  }

  let activitySourceLanguage: SupportedLang | null = null;
  let activityTranslations: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
    Prisma.JsonNull;

  if (typeof activity === "string" && activity.trim()) {
    const translationResult = await translateAllLanguages(activity);
    activitySourceLanguage = translationResult.sourceLanguage;
    activityTranslations = toPrismaNullableJsonInput(translationResult.translations);
  }

  let locationSourceLanguage: SupportedLang | null = null;
  let locationTranslations: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
    Prisma.JsonNull;

  if (typeof location === "string" && location.trim()) {
    const translationResult = await translateAllLanguages(location);
    locationSourceLanguage = translationResult.sourceLanguage;
    locationTranslations = toPrismaNullableJsonInput(translationResult.translations);
  }

  let noteEmployeeSourceLanguage: SupportedLang | null = null;
  let noteEmployeeTranslations: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
    Prisma.JsonNull;

  if (typeof noteEmployee === "string" && noteEmployee.trim()) {
    const translationResult = await translateAllLanguages(noteEmployee);
    noteEmployeeSourceLanguage = translationResult.sourceLanguage;
    noteEmployeeTranslations = toPrismaNullableJsonInput(translationResult.translations);
  }

  const data = {
    userId: String(userId),
    workDate: parseYMD(String(workDate)),
    startHHMM: String(startHHMM),
    endHHMM: String(endHHMM),
    activity: String(activity),
    activitySourceLanguage,
    activityTranslations,
    location: location ? String(location) : "",
    locationSourceLanguage,
    locationTranslations,
    travelMinutes: Number(travelMinutes ?? 0),
    noteEmployee: noteEmployee ? String(noteEmployee) : null,
    noteEmployeeSourceLanguage,
    noteEmployeeTranslations,
  };

  if (id) {
    const existingEntry = await prisma.planEntry.findUnique({
      where: { id: String(id) },
      select: {
        id: true,
        user: {
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "PlanEntry not found" }, { status: 404 });
    }

    if (existingEntry.user.companyId !== admin.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const saved = id
    ? await prisma.planEntry.update({ where: { id: String(id) }, data })
    : await prisma.planEntry.create({ data });

  return NextResponse.json({ ok: true, entry: saved });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id missing" }, { status: 400 });

  const existingEntry = await prisma.planEntry.findUnique({
    where: { id: String(id) },
    select: {
      id: true,
      user: {
        select: {
          companyId: true,
        },
      },
    },
  });

  if (!existingEntry) {
    return NextResponse.json({ error: "PlanEntry not found" }, { status: 404 });
  }

  if (existingEntry.user.companyId !== admin.companyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.planEntry.delete({ where: { id: String(id) } });
  return NextResponse.json({ ok: true });
}