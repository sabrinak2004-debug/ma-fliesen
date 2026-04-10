import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Prisma, Role } from "@prisma/client";
import Holidays from "date-holidays";
import { toHHMMUTC } from "@/lib/time";

function toIsoDateUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type HolidayInfo = {
  name: string;
  type: string;
};

function getHolidayMapForMonth(year: number, monthOneBased: number): Map<string, HolidayInfo> {
  const hd = new Holidays("DE", "BW");
  const holidays = hd.getHolidays(year);

  const monthPrefix = `${year}-${String(monthOneBased).padStart(2, "0")}`;
  const map = new Map<string, HolidayInfo>();

  for (const holiday of holidays) {
    const iso = holiday.date.slice(0, 10);
    if (!iso.startsWith(`${monthPrefix}-`)) continue;
    if (holiday.type !== "public") continue;

    map.set(iso, {
      name: holiday.name,
      type: holiday.type,
    });
  }

  return map;
}

type PlanPreviewItem = {
  startHHMM: string;
  endHHMM: string;
  activity: string;
  activityTranslations: Prisma.JsonValue | null;
  location: string;
  locationTranslations: Prisma.JsonValue | null;
  noteEmployee: string | null;
  noteEmployeeTranslations: Prisma.JsonValue | null;
};

type SupportedLang = "DE" | "EN" | "IT" | "TR" | "SQ" | "KU";
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
    language === "KU"
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userIdParam = searchParams.get("userId");
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const month = searchParams.get("month"); // YYYY-MM
  if (!month) return NextResponse.json({ error: "month fehlt" }, { status: 400 });

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month Format muss YYYY-MM sein" }, { status: 400 });
  }

  const [y, m] = month.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1));
  const to = new Date(Date.UTC(y, m, 1));
  const holidayMap = getHolidayMapForMonth(y, m);

  const me = await prisma.appUser.findUnique({
    where: { id: session.userId },
    select: { role: true, isActive: true, companyId: true },
  });

  if (!me || !me.isActive) return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });

  // ✅ ADMIN: nur Termine (CalendarEvent) – keine Abwesenheiten / PlanEntries etc.
  // ✅ ADMIN: ohne userIdParam = eigene Termine (CalendarEvent)
// ✅ ADMIN: mit userIdParam = Mitarbeiter-Kalender (Work/Absence/Plan)
if (me.role === Role.ADMIN && !userIdParam) {
    const events = await prisma.calendarEvent.findMany({
      where: { userId: session.userId, startAt: { gte: from, lt: to } },
      orderBy: [{ startAt: "asc" }],
      select: { startAt: true, endAt: true, title: true, location: true },
    });

    const eventMap = new Map<string, Array<{ start: Date; end: Date; title: string; location: string | null }>>();
    for (const e of events) {
      const key = toIsoDateUTC(e.startAt);
      const list = eventMap.get(key) ?? [];
      list.push({ start: e.startAt, end: e.endAt, title: e.title, location: e.location ?? null });
      eventMap.set(key, list);
    }

    const eventSet = new Set(eventMap.keys());
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const dd = String(i + 1).padStart(2, "0");
      const date = `${month}-${dd}`;

      const list = eventMap.get(date) ?? [];
      const preview =
        list.length === 0
          ? null
          : list
              .slice(0, 2)
              .map((x) => {
                const base = `${toHHMMUTC(x.start)}–${toHHMMUTC(x.end)} ${x.title}`.trim();
                return x.location ? `${base} · ${x.location}` : base;
              })
              .join(" | ");

const holiday = holidayMap.get(date);

        return {
          date,
          hasWork: false,
          hasVacation: false,
          hasSick: false,
          hasPlan: eventSet.has(date),
          planPreview: preview,
          hasHoliday: !!holiday,
          holidayName: holiday?.name ?? null,
        };
    });

    return NextResponse.json({ ok: true, days });
  }

  /**
 * ✅ EMPLOYEE: eigener Kalender
 * ✅ ADMIN mit userIdParam: Mitarbeiter-Kalender (read-only in UI)
 */
const targetUserId = me.role === Role.ADMIN && userIdParam ? userIdParam : session.userId;

if (me.role === Role.ADMIN && userIdParam) {
  const target = await prisma.appUser.findFirst({
    where: {
      id: userIdParam,
      companyId: me.companyId,
    },
    select: { id: true, role: true, isActive: true },
  });

  if (!target || !target.isActive || target.role !== Role.EMPLOYEE) {
    return NextResponse.json({ ok: false, error: "Mitarbeiter nicht gefunden" }, { status: 404 });
  }
}
  const userWhere = { userId: targetUserId };

  const [entries, absences, planEntries] = await Promise.all([
    prisma.workEntry.findMany({
      where: { ...userWhere, workDate: { gte: from, lt: to } },
      orderBy: [{ workDate: "asc" }, { startTime: "asc" }],
    }),
    prisma.absence.findMany({
      where: { ...userWhere, absenceDate: { gte: from, lt: to } },
      orderBy: [{ absenceDate: "asc" }],
    }),
    prisma.planEntry.findMany({
      where: { ...userWhere, workDate: { gte: from, lt: to } },
      select: {
        workDate: true,
        startHHMM: true,
        endHHMM: true,
        activity: true,
        activityTranslations: true,
        location: true,
        locationTranslations: true,
        noteEmployee: true,
        noteEmployeeTranslations: true,
      },
      orderBy: [{ workDate: "asc" }, { startHHMM: "asc" }],
    }),
  ]);

  const workSet = new Set(entries.map((e) => toIsoDateUTC(e.workDate)));
  const vacSet = new Set(absences.filter((a) => a.type === "VACATION").map((a) => toIsoDateUTC(a.absenceDate)));
  const sickSet = new Set(absences.filter((a) => a.type === "SICK").map((a) => toIsoDateUTC(a.absenceDate)));

  const planMap = new Map<string, PlanPreviewItem[]>();
  for (const p of planEntries) {
    const key = toIsoDateUTC(p.workDate);
    const list = planMap.get(key) ?? [];
    list.push({
      startHHMM: p.startHHMM,
      endHHMM: p.endHHMM,
      activity: p.activity ?? "",
      activityTranslations: p.activityTranslations ?? null,
      location: p.location ?? "",
      locationTranslations: p.locationTranslations ?? null,
      noteEmployee: p.noteEmployee ?? null,
      noteEmployeeTranslations: p.noteEmployeeTranslations ?? null,
    });
    planMap.set(key, list);
  }
  const planSet = new Set(planMap.keys());

  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const dd = String(i + 1).padStart(2, "0");
    const date = `${month}-${dd}`;

    const plans = planMap.get(date) ?? [];
    const planPreview =
      plans.length === 0
        ? null
        : plans
            .slice(0, 2)
            .map((x) => {
              const translatedActivity = getTranslatedText(
                x.activity,
                x.activityTranslations,
                session.language
              );

              const translatedLocation = getTranslatedText(
                x.location,
                x.locationTranslations,
                session.language
              );

              const base = `${x.startHHMM}–${x.endHHMM} ${translatedActivity}`.trim();
              const withLoc = translatedLocation ? `${base} · ${translatedLocation}` : base;
              const translatedNote = getTranslatedText(
                x.noteEmployee,
                x.noteEmployeeTranslations,
                session.language
              );

              return translatedNote ? `${withLoc} · 📝 ${translatedNote}` : withLoc;
            })
            .join(" | ");

    const holiday = holidayMap.get(date);

    return {
      date,
      hasWork: workSet.has(date) || planSet.has(date),
      hasVacation: vacSet.has(date),
      hasSick: sickSet.has(date),
      hasPlan: planSet.has(date),
      planPreview,
      hasHoliday: !!holiday,
      holidayName: holiday?.name ?? null,
    };
  });

  return NextResponse.json({ ok: true, days });
}