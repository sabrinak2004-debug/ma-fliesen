import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { getSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { translateAllLanguages, type SupportedLang } from "@/lib/translate";
import {
  ADMIN_WEEKLY_PLAN_UI_TEXTS,
  normalizeAppUiLanguage,
  translate,
  type AdminWeeklyPlanTextKey,
  type AppUiLanguage,
} from "@/lib/i18n";


function hasCompanyScope(
  value: unknown
): value is { userId: string; companyId: string; role: "ADMIN" | "EMPLOYEE" } {
  if (typeof value !== "object" || value === null) return false;

  const record = value as Record<string, unknown>;

  return (
    typeof record.userId === "string" &&
    typeof record.companyId === "string" &&
    (record.role === "ADMIN" || record.role === "EMPLOYEE")
  );
}

function parseYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function timeToDbTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const t = new Date(0);
  // TIME-only: Datum ist egal
  t.setUTCHours(h, m, 0, 0);
  return t;
}

function minutesBetween(startHHMM: string, endHHMM: string) {
  const [sh, sm] = startHHMM.split(":").map(Number);
  const [eh, em] = endHHMM.split(":").map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  return Math.max(0, end - start);
}

function legalBreakMinutes(grossMinutes: number): number {
  if (!Number.isFinite(grossMinutes) || grossMinutes <= 0) return 0;
  if (grossMinutes > 9 * 60) return 45;
  if (grossMinutes > 6 * 60) return 30;
  return 0;
}

function normalizeBreakMinutes(input: number | undefined, grossMinutes: number): { breakMinutes: number; breakAuto: boolean } {
  const safeGross = Math.max(0, Math.round(grossMinutes));
  const inVal = typeof input === "number" && Number.isFinite(input) ? input : 0;

  if (inVal <= 0) return { breakMinutes: legalBreakMinutes(safeGross), breakAuto: true };

  const b = Math.max(0, Math.round(inVal));
  return { breakMinutes: Math.min(b, safeGross), breakAuto: false };
}

function hhmmFromTime(dt: Date) {
  const h = String(dt.getUTCHours()).padStart(2, "0");
  const m = String(dt.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// ✅ Typ für findMany-Ergebnis (inkl. user select)
type WorkEntryWithUser = Prisma.WorkEntryGetPayload<{
  include: { user: { select: { id: true; fullName: true } } };
}>;

type WorkEntryUI = {
  id: string;
  userId: string;
  workDate: Date;
  startHHMM: string;
  endHHMM: string;
  activity: string;
  location: string;
  travelMinutes: number;
  workMinutes: number;
  grossMinutes: number;
  breakMinutes: number;
  breakAuto: boolean;
  user: { id: string; fullName: string };
};

type WorkEntryPostBody = {
  id?: string;
  userId: string;
  workDate: string;   // YYYY-MM-DD
  startHHMM: string;  // "07:00"
  endHHMM: string;    // "16:00"
  activity: string;
  location?: string;
  travelMinutes?: number;
  breakMinutes?: number;
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

function tWorkEntries(
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
    return NextResponse.json(
      { error: tWorkEntries("DE", "forbidden") },
      { status: 403 }
    );
  }

  const adminUser = await prisma.appUser.findUnique({
    where: { id: admin.id },
    select: {
      language: true,
    },
  });

  const session = await getSession();
  if (!hasCompanyScope(session) || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: tWorkEntries(adminUser?.language ?? "DE", "forbidden") },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const weekStart = url.searchParams.get("weekStart"); // Montag YYYY-MM-DD
  if (!weekStart) {
    return NextResponse.json(
      { error: tWorkEntries(adminUser?.language ?? "DE", "weekStartMissing") },
      { status: 400 }
    );
  }

  const start = parseYMD(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const entries: WorkEntryWithUser[] = await prisma.workEntry.findMany({
    where: {
      workDate: { gte: start, lt: end },
      user: {
        companyId: session.companyId,
      },
    },
    include: { user: { select: { id: true, fullName: true } } },
    orderBy: [{ workDate: "asc" }, { startTime: "asc" }],
  });

  const ui: WorkEntryUI[] = entries.map((e) => ({
    id: e.id,
    userId: e.userId,
    workDate: e.workDate,
    startHHMM: hhmmFromTime(e.startTime),
    endHHMM: hhmmFromTime(e.endTime),
    activity: getTranslatedText(
      e.activity,
      e.activityTranslations,
      adminUser?.language ?? "DE"
    ),
    location: getTranslatedText(
      e.location,
      e.locationTranslations,
      adminUser?.language ?? "DE"
    ),
    travelMinutes: e.travelMinutes,
    workMinutes: e.workMinutes,
    grossMinutes: e.grossMinutes ?? 0,
    breakMinutes: e.breakMinutes ?? 0,
    breakAuto: e.breakAuto ?? false,
    user: e.user,
  }));

  return NextResponse.json({ entries: ui });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: tWorkEntries("DE", "forbidden") },
      { status: 403 }
    );
  }

  const adminUser = await prisma.appUser.findUnique({
    where: { id: admin.id },
    select: {
      language: true,
    },
  });

  const session = await getSession();
  if (!hasCompanyScope(session) || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: tWorkEntries(adminUser?.language ?? "DE", "forbidden") },
      { status: 403 }
    );
  }

  const body = (await req.json()) as Partial<WorkEntryPostBody>;

  const {
    id,
    userId,
    workDate,
    startHHMM,
    endHHMM,
    activity,
    location,
    travelMinutes,
  } = body ?? {};

  if (!userId || !workDate || !startHHMM || !endHHMM || !activity) {
    return NextResponse.json(
      { error: tWorkEntries(adminUser?.language ?? "DE", "missingFields") },
      { status: 400 }
    );
  }

  const targetUser = await prisma.appUser.findFirst({
    where: {
      id: String(userId),
      companyId: session.companyId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!targetUser) {
    return NextResponse.json(
      { error: tWorkEntries(adminUser?.language ?? "DE", "invalidUserId") },
      { status: 400 }
    );
  }

  const grossMinutes = minutesBetween(startHHMM, endHHMM);
  if (grossMinutes <= 0) {
    return NextResponse.json({ error: "endHHMM must be after startHHMM" }, { status: 400 });
  }

  const brk = normalizeBreakMinutes(body.breakMinutes, grossMinutes);
  const netMinutes = Math.max(0, grossMinutes - brk.breakMinutes);

  let activitySourceLanguage: SupportedLang | null = null;
  let activityTranslations: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
    Prisma.JsonNull;

  if (typeof activity === "string" && activity.trim()) {
    const translationResult = await translateAllLanguages(activity);
    activitySourceLanguage = translationResult.sourceLanguage;
    activityTranslations = toPrismaNullableJsonInput(
      translationResult.translations
    );
  }

  let locationSourceLanguage: SupportedLang | null = null;
  let locationTranslations: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
    Prisma.JsonNull;

  if (typeof location === "string" && location.trim()) {
    const translationResult = await translateAllLanguages(location);
    locationSourceLanguage = translationResult.sourceLanguage;
    locationTranslations = toPrismaNullableJsonInput(
      translationResult.translations
    );
  }

  const data: Prisma.WorkEntryUncheckedCreateInput = {
    userId: targetUser.id,
    workDate: parseYMD(String(workDate)),
    startTime: timeToDbTime(String(startHHMM)),
    endTime: timeToDbTime(String(endHHMM)),
    activity: String(activity),
    activitySourceLanguage,
    activityTranslations,
    location: location ? String(location) : "",
    locationSourceLanguage,
    locationTranslations,
    travelMinutes: travelMinutes ?? 0,
    grossMinutes,
    breakMinutes: brk.breakMinutes,
    breakAuto: brk.breakAuto,
    workMinutes: netMinutes,
  };

  let saved;

  if (id) {
    const existing = await prisma.workEntry.findFirst({
      where: {
        id: String(id),
        user: {
          companyId: session.companyId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: tWorkEntries(adminUser?.language ?? "DE", "entryNotFound") },
        { status: 404 }
      );
    }

    saved = await prisma.workEntry.update({
      where: { id: existing.id },
      data,
    });
  } else {
    saved = await prisma.workEntry.create({ data });
  }

  return NextResponse.json({ ok: true, entry: saved });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: tWorkEntries("DE", "forbidden") },
      { status: 403 }
    );
  }

  const adminUser = await prisma.appUser.findUnique({
    where: { id: admin.id },
    select: {
      language: true,
    },
  });

  const session = await getSession();
  if (!hasCompanyScope(session) || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: tWorkEntries(adminUser?.language ?? "DE", "forbidden") },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id missing" }, { status: 400 });

  const existing = await prisma.workEntry.findFirst({
    where: {
      id,
      user: {
        companyId: session.companyId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: tWorkEntries(adminUser?.language ?? "DE", "entryNotFound") },
      { status: 404 }
    );
  }

  await prisma.workEntry.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}