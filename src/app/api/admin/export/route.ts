// src/app/api/admin/export/route.ts
import { NextResponse } from "next/server";
import JSZip from "jszip";
import { AbsenceCompensation, AbsenceType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Holidays from "date-holidays";
import { formatGermanDateTime } from "@/lib/time";

/** === Payroll Settings (anpassen falls nötig) === */
const STANDARD_DAY_HOURS = 8; // Referenzwert für Urlaub/Krankheit/Feiertag in Stunden
const ROUND_TO_MINUTES = 15; // z.B. 15 = Viertelstunde (0,25h), 5 = 5-Minuten, 1 = Minuten-genau

const ANNUAL_VACATION_DAYS = 30;
const MONTHLY_VACATION_ACCRUAL_DAYS = ANNUAL_VACATION_DAYS / 12;

function getAccruedVacationDaysUntilMonth(monthOneBased: number): number {
  return Math.min(
    ANNUAL_VACATION_DAYS,
    monthOneBased * MONTHLY_VACATION_ACCRUAL_DAYS
  );
}

function getPeriodEndInfo(
  rangeISO?: { fromISO: string; toISO: string; state: string }
): { year: number; month: number } | null {
  if (!rangeISO) return null;

  const endDate = new Date(`${rangeISO.toISO}T00:00:00.000Z`);
  if (Number.isNaN(endDate.getTime())) return null;

  return {
    year: endDate.getUTCFullYear(),
    month: endDate.getUTCMonth() + 1,
  };
}

function sumPaidVacationDaysFromAbsences(
  absences: Array<{ type: AbsenceType; compensation: AbsenceCompensation; dayPortion: string }>
): number {
  return absences.reduce((sum, row) => {
    if (row.type !== AbsenceType.VACATION) return sum;
    if (row.compensation !== AbsenceCompensation.PAID) return sum;
    return sum + getAbsenceDayFraction(row.dayPortion);
  }, 0);
}

type SessionLike = {
  userId?: string;
  user?: { id?: string };
};

type TranslationMap = Partial<
  Record<"DE" | "EN" | "IT" | "TR" | "SQ" | "KU" | "RO", string>
>;

function isTranslationMap(
  value: Prisma.JsonValue | null | undefined
): value is TranslationMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return true;
}

function getGermanTranslatedText(
  originalText: string | null | undefined,
  translations: Prisma.JsonValue | null | undefined
): string {
  const fallback = originalText ?? "";

  if (!isTranslationMap(translations)) {
    return fallback;
  }

  const translated = translations.DE;
  return typeof translated === "string" && translated.trim()
    ? translated
    : fallback;
}

type WorkEntryWithUser = Prisma.WorkEntryGetPayload<{
  include: { user: true };
}>;

type AbsenceWithUser = Prisma.AbsenceGetPayload<{
  include: { user: true };
}>;

type LoadDataResult = {
  entries: WorkEntryWithUser[];
  absences: AbsenceWithUser[];
  vacationYtdAbsences: AbsenceWithUser[];
};

function getSessionUserId(session: unknown): string | null {
  if (typeof session !== "object" || session === null) return null;
  const s = session as SessionLike;
  return s.userId ?? s.user?.id ?? null;
}

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  const needsQuotes = /[",\n\r;]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function companyFilePrefix(companySubdomain: string | null | undefined): string {
  const safe = (companySubdomain ?? "").trim().toLowerCase();
  return safe ? safeFileName(safe) : "mitarbeiterportal";
}

function safeFileName(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildContentDisposition(filename: string): string {
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${filename}"; filename*=UTF-8''${encoded}`;
}

function buildCsvLines(lines: Array<Array<unknown>>): string {
  const sep = ";"; // Excel/Numbers DE
  const body = lines.map((cols) => cols.map(csvEscape).join(sep)).join("\n");
  return "\ufeff" + body + "\n"; // BOM für Umlaute
}

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function timeOnly(d: Date): string {
  return d.toISOString().slice(11, 16);
}

function isValidYYYYMM(s: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}

function isValidYYYY(s: string): boolean {
  return /^\d{4}$/.test(s);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function monthRangeFromYYYYMM(month: string): { start: Date; endInclusive: Date } {
  const [yStr, mStr] = month.split("-");
  const y = Number(yStr);
  const m = Number(mStr); // 1..12
  const start = new Date(Date.UTC(y, m - 1, 1));
  const endExclusive = new Date(Date.UTC(y, m, 1));
  const endInclusive = new Date(endExclusive.getTime() - 1);
  return { start, endInclusive };
}

function weekdayShortDE(yyyyMmDd: string): string {
  const d = new Date(`${yyyyMmDd}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("de-DE", { weekday: "short", timeZone: "UTC" }).format(d);
}

function formatHoursDE(hours: number): string {
  return hours.toFixed(2).replace(".", ",");
}

function roundMinutes(minutes: number, stepMinutes: number): number {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  const step = Math.max(1, Math.floor(stepMinutes));
  return Math.round(minutes / step) * step;
}

function isWeekendUTC(yyyyMmDd: string): boolean {
  const d = new Date(`${yyyyMmDd}T00:00:00.000Z`);
  const wd = d.getUTCDay(); // 0=So ... 6=Sa
  return wd === 0 || wd === 6;
}

function legalBreakMinutes(grossMinutes: number): number {
  if (!Number.isFinite(grossMinutes) || grossMinutes <= 0) return 0;
  if (grossMinutes > 9 * 60) return 45;
  if (grossMinutes > 6 * 60) return 30;
  return 0;
}

type DayAgg = { gross: number; manualBreak: number };

type AbsenceDayValue = {
  days: number;
  minutes: number;
};

function getAbsenceDayFraction(dayPortion: string): number {
  return dayPortion === "HALF_DAY" ? 0.5 : 1;
}

function getAbsenceMinutes(dayPortion: string): number {
  return getAbsenceDayFraction(dayPortion) * STANDARD_DAY_HOURS * 60;
}

function formatDayHourLabel(days: number, minutes: number, dayLabel: string): string {
  const wholeLabel = days === 1 ? dayLabel : `${dayLabel}e`;
  return `${String(days).replace(".", ",")} ${wholeLabel} (${formatHoursDE(minutes / 60)} Stunden)`;
}

function isoDayUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function loadData(
  from: Date | null,
  to: Date | null,
  userId: string | null,
  companyId: string
): Promise<LoadDataResult> {
  const entriesWhere =
    from || to || userId
      ? {
          ...(userId ? { userId } : {}),
          user: {
            companyId,
          },
          workDate: {
            gte: from ?? undefined,
            lte: to ?? undefined,
          },
        }
      : {
          user: {
            companyId,
          },
        };

  const absWhere =
    from || to || userId
      ? {
          ...(userId ? { userId } : {}),
          user: {
            companyId,
          },
          absenceDate: {
            gte: from ?? undefined,
            lte: to ?? undefined,
          },
        }
      : {
          user: {
            companyId,
          },
        };

  const periodEnd = to ?? null;

  const vacationYtdWhere =
    periodEnd
      ? {
          ...(userId ? { userId } : {}),
          user: {
            companyId,
          },
          type: AbsenceType.VACATION,
          compensation: AbsenceCompensation.PAID,
          absenceDate: {
            gte: new Date(Date.UTC(periodEnd.getUTCFullYear(), 0, 1)),
            lte: periodEnd,
          },
        }
      : null;

  const [entries, absences, vacationYtdAbsences] = await Promise.all([
    prisma.workEntry.findMany({
      where: entriesWhere,
      include: { user: true },
      orderBy: [{ workDate: "asc" }, { startTime: "asc" }],
    }),
    prisma.absence.findMany({
      where: absWhere,
      include: { user: true },
      orderBy: [{ absenceDate: "asc" }],
    }),
    vacationYtdWhere
      ? prisma.absence.findMany({
          where: vacationYtdWhere,
          include: { user: true },
          orderBy: [{ absenceDate: "asc" }],
        })
      : Promise.resolve<AbsenceWithUser[]>([]),
  ]);

  return { entries, absences, vacationYtdAbsences };
}

type Loaded = LoadDataResult;

function computeDayAgg(entries: Loaded["entries"]): Map<string, DayAgg> {
  const map = new Map<string, DayAgg>();

  for (const e of entries) {
    const dayKey = isoDayUTC(e.workDate);
    const cur = map.get(dayKey) ?? { gross: 0, manualBreak: 0 };

    const gross = Number.isFinite(e.grossMinutes) ? e.grossMinutes : 0;
    const brk = Number.isFinite(e.breakMinutes) ? e.breakMinutes : 0;

    cur.gross += gross;
    if (brk > 0) cur.manualBreak = Math.max(cur.manualBreak, brk);

    map.set(dayKey, cur);
  }

  return map;
}

function dayBreakAndAuto(grossDay: number, manualBreak: number): { breakMinutes: number; auto: boolean } {
  const gross = Math.max(0, Math.round(grossDay));
  const manual = Math.max(0, Math.round(manualBreak));
  if (manual > 0) return { breakMinutes: Math.min(manual, gross), auto: false };
  return { breakMinutes: legalBreakMinutes(gross), auto: true };
}

/** ===== Feiertage automatisch (DE + Bundesland via date-holidays) ===== */
type HolidayInfo = { name: string };

function eachDayISOInclusive(fromISO: string, toISO: string): string[] {
  const out: string[] = [];
  const cur = new Date(`${fromISO}T00:00:00.000Z`);
  const end = new Date(`${toISO}T00:00:00.000Z`);

  while (cur <= end) {
    out.push(dateOnly(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  return out;
}

function buildHolidayMapDE(fromISO: string, toISO: string, state: string): Map<string, HolidayInfo> {
  const hd = new Holidays("DE", state);
  const res = new Map<string, HolidayInfo>();

  for (const d of eachDayISOInclusive(fromISO, toISO)) {
    const date = new Date(`${d}T00:00:00.000Z`);
    const hit = hd.isHoliday(date);

    if (!hit) continue;

    const first = Array.isArray(hit) ? hit[0] : hit;
    if (!first?.name) continue;

    res.set(d, { name: String(first.name) });
  }

  return res;
}

type UserBlock = {
  userId: string;
  name: string;
  entries: Loaded["entries"];
  absences: Loaded["absences"];
  vacationYtdAbsences: Loaded["vacationYtdAbsences"];
};

function groupByUser(data: Loaded): UserBlock[] {
  const map: Map<string, UserBlock> = new Map();

  for (const e of data.entries) {
    const userId = e.userId;
    const name = e.user.fullName;
    const cur: UserBlock =
      map.get(userId) ?? {
        userId,
        name,
        entries: [],
        absences: [],
        vacationYtdAbsences: [],
      };

    cur.entries.push(e);
    map.set(userId, cur);
  }

  for (const a of data.vacationYtdAbsences) {
    const userId = a.userId;
    const name = a.user.fullName;

    const existing = map.get(userId);

    if (existing) {
      existing.vacationYtdAbsences.push(a);
      map.set(userId, existing);
      continue;
    }

    const cur: UserBlock = {
      userId,
      name,
      entries: [],
      absences: [],
      vacationYtdAbsences: [a],
    };

    map.set(userId, cur);
  }

  for (const a of data.absences) {
    const userId = a.userId;
    const name = a.user.fullName;
    const cur: UserBlock =
      map.get(userId) ?? {
        userId,
        name,
        entries: [],
        absences: [],
        vacationYtdAbsences: [],
      };

    cur.absences.push(a);
    map.set(userId, cur);
  }

  const blocks = Array.from(map.values()).sort((x, y) => x.name.localeCompare(y.name, "de"));

  for (const b of blocks) {
    b.entries.sort((a, z) => {
      const d = a.workDate.getTime() - z.workDate.getTime();
      if (d !== 0) return d;
      return a.startTime.getTime() - z.startTime.getTime();
    });

    b.absences.sort((a, z) => a.absenceDate.getTime() - z.absenceDate.getTime());
  }

  return blocks;
}

/**
 * Payroll CSV:
 * - pro Mitarbeiter: Summary + Details
 * - Details enthalten auch Feiertage als Zeilen (FEIERTAG) im Zeitraum
 */
function buildPayrollCsv(
  data: Loaded,
  labelPeriod: string,
  rangeISO?: { fromISO: string; toISO: string; state: string }
): string {
  const blocks = groupByUser(data);

  const holidayMap =
    rangeISO && rangeISO.fromISO && rangeISO.toISO
      ? buildHolidayMapDE(rangeISO.fromISO, rangeISO.toISO, rangeISO.state)
      : new Map<string, HolidayInfo>();

  const allDaysInRange = rangeISO ? eachDayISOInclusive(rangeISO.fromISO, rangeISO.toISO) : [];
  const lines: Array<Array<unknown>> = [];

  lines.push(["Payroll Export"]);
  lines.push(["Zeitraum", labelPeriod]);
  lines.push(["Standard Tagessoll (h)", STANDARD_DAY_HOURS]);
  lines.push(["Rundung (Minuten)", ROUND_TO_MINUTES]);
  lines.push(["Export erstellt am", formatGermanDateTime(new Date())]);
  lines.push([]);

  const periodEndInfo = getPeriodEndInfo(rangeISO);

  const vacationMetaByUser = new Map<
    string,
    {
      entitlementDays: number | null;
      remainingVacationDays: number | null;
    }
  >();

  for (const b of blocks) {
    if (!periodEndInfo) {
      vacationMetaByUser.set(b.userId, {
        entitlementDays: null,
        remainingVacationDays: null,
      });
      continue;
    }

    const entitlementDays = getAccruedVacationDaysUntilMonth(periodEndInfo.month);
    const usedVacationDaysYtd = sumPaidVacationDaysFromAbsences(b.vacationYtdAbsences);

    const remainingVacationDays = Math.max(
      0,
      entitlementDays - usedVacationDaysYtd
    );

    vacationMetaByUser.set(b.userId, {
      entitlementDays,
      remainingVacationDays,
    });
  }

  for (const b of blocks) {
    const dayAgg = computeDayAgg(b.entries);

    let totalNetMinutes = 0;
    for (const v of dayAgg.values()) {
      const info = dayBreakAndAuto(v.gross, v.manualBreak);
      const netDay = Math.max(0, Math.round(v.gross) - info.breakMinutes);
      totalNetMinutes += netDay;
    }

    const totalTravelMinutes = b.entries.reduce(
      (s, e) => s + (Number.isFinite(e.travelMinutes) ? e.travelMinutes : 0),
      0
    );

    const workedDates = new Set(b.entries.map((e) => dateOnly(e.workDate)));

    const vacationAbsences = b.absences.filter((a) => a.type === AbsenceType.VACATION);
    const sickAbsences = b.absences.filter((a) => a.type === AbsenceType.SICK);

    const paidVacationAbsences = vacationAbsences.filter(
      (a) => a.compensation === AbsenceCompensation.PAID
    );
    const unpaidVacationAbsences = vacationAbsences.filter(
      (a) => a.compensation === AbsenceCompensation.UNPAID
    );
    const paidSickAbsences = sickAbsences.filter(
      (a) => a.compensation === AbsenceCompensation.PAID
    );

    const holidayDates = new Set<string>();
    if (rangeISO) {
      for (const d of allDaysInRange) {
        const h = holidayMap.get(d);
        if (!h) continue;
        if (isWeekendUTC(d)) continue;
        holidayDates.add(d);
      }
    }

    let expectedWorkdays = 0;
    if (rangeISO) {
      for (const d of allDaysInRange) {
        if (isWeekendUTC(d)) continue;
        if (holidayDates.has(d)) continue;
        expectedWorkdays += 1;
      }
    }

    const expectedMinutesBrutto = expectedWorkdays * STANDARD_DAY_HOURS * 60;

    const vacationDays = paidVacationAbsences.reduce(
      (sum, row) => sum + getAbsenceDayFraction(row.dayPortion),
      0
    );
    const vacationMinutes = paidVacationAbsences.reduce(
      (sum, row) => sum + getAbsenceMinutes(row.dayPortion),
      0
    );

    const sickDays = paidSickAbsences.reduce(
      (sum, row) => sum + getAbsenceDayFraction(row.dayPortion),
      0
    );
    const sickMinutes = paidSickAbsences.reduce(
      (sum, row) => sum + getAbsenceMinutes(row.dayPortion),
      0
    );

    const paidAbsenceDays = vacationDays + sickDays;
    const paidAbsenceMinutes = vacationMinutes + sickMinutes;

    const holidayPaidDateSet = new Set(
      Array.from(holidayDates).filter((dateKey) => !workedDates.has(dateKey))
    );

    const holidayDays = holidayPaidDateSet.size;
    const holidayMinutes = holidayDays * STANDARD_DAY_HOURS * 60;

    const unpaidAbsenceDays = unpaidVacationAbsences.reduce(
      (sum, row) => sum + getAbsenceDayFraction(row.dayPortion),
      0
    );
    const unpaidAbsenceMinutes = unpaidVacationAbsences.reduce(
      (sum, row) => sum + getAbsenceMinutes(row.dayPortion),
      0
    );

    const absenceCoveredDates = new Set(
      b.absences.map((a) => dateOnly(a.absenceDate))
    );

    let missingWorkEntryDays = 0;
    if (rangeISO) {
      for (const d of allDaysInRange) {
        if (isWeekendUTC(d)) continue;
        if (holidayDates.has(d)) continue;
        if (workedDates.has(d)) continue;
        if (absenceCoveredDates.has(d)) continue;
        missingWorkEntryDays += 1;
      }
    }

    const missingWorkEntryMinutes = missingWorkEntryDays * STANDARD_DAY_HOURS * 60;

    const workedHours = totalNetMinutes / 60;
    const expectedHoursBrutto = expectedMinutesBrutto / 60;

    const payableMinutesTotal = totalNetMinutes + paidAbsenceMinutes + holidayMinutes;
    const overtimeBruttoHours = (totalNetMinutes - expectedMinutesBrutto) / 60;
    const overtimeNettoHours = (payableMinutesTotal - expectedMinutesBrutto) / 60;

    lines.push(["Mitarbeiter", b.name]);

    const vacationMeta = vacationMetaByUser.get(b.userId) ?? {
      entitlementDays: null,
      remainingVacationDays: null,
    };

    lines.push([
      "Summary",
      "Soll-Arbeitstage",
      "Sollstunden",
      "Arbeitsstunden (Ist)",
      "Überstunden (Brutto)",
      "Überstunden (Netto)",
      "Fahrtminuten",
      "Urlaubsanspruch",
      "Resturlaub",
      "Urlaubstage",
      "Krankheitstage",
      "Feiertage",
      "Bezahlte Abwesenheitstage (U+K)",
      "Unbezahlte Abwesenheitszeiten",
      "Fehlende Arbeitseinträge",
      "Bezahlte Stunden (gesamt)",
    ]);

    lines.push([
      "",
      rangeISO ? expectedWorkdays : "",
      rangeISO ? formatHoursDE(expectedHoursBrutto) : "",
      formatHoursDE(workedHours),
      rangeISO ? formatHoursDE(overtimeBruttoHours) : "",
      rangeISO ? formatHoursDE(overtimeNettoHours) : "",
      totalTravelMinutes,
      vacationMeta.entitlementDays !== null
        ? String(vacationMeta.entitlementDays).replace(".", ",")
        : "",
      vacationMeta.remainingVacationDays !== null
        ? String(vacationMeta.remainingVacationDays).replace(".", ",")
        : "",
      formatDayHourLabel(vacationDays, vacationMinutes, "Tag"),
      formatDayHourLabel(sickDays, sickMinutes, "Tag"),
      rangeISO ? formatDayHourLabel(holidayDays, holidayMinutes, "Tag") : "",
      formatDayHourLabel(paidAbsenceDays, paidAbsenceMinutes, "Tag"),
      formatDayHourLabel(unpaidAbsenceDays, unpaidAbsenceMinutes, "Tag"),
      rangeISO ? formatDayHourLabel(missingWorkEntryDays, missingWorkEntryMinutes, "Tag") : "",
      formatHoursDE(payableMinutesTotal / 60),
    ]);

    lines.push([]);

    lines.push([
      "Datum",
      "Wochentag",
      "Typ",
      "FeiertagName",
      "Start",
      "Ende",
      "BruttoMinuten",
      "PauseMinuten",
      "PauseAuto",
      "NettoArbeitsminuten",
      "Fahrtminuten",
      "Tätigkeit",
      "Ort",
      "Erstellt am",
    ]);

    type DetailRow = { sortKey: string; cols: Array<unknown> };
    const details: DetailRow[] = [];

    for (const e of b.entries) {
      const d = dateOnly(e.workDate);
      const start = timeOnly(e.startTime);
      const end = timeOnly(e.endTime);
      const h = holidayMap.get(d);

      const dayInfo = dayAgg.get(d) ?? { gross: 0, manualBreak: 0 };
      const breakInfo = dayBreakAndAuto(dayInfo.gross, dayInfo.manualBreak);
      const isFirstOfDay = !details.some((x) => x.sortKey.startsWith(`${d}T`));
      const pauseThisRow = isFirstOfDay ? breakInfo.breakMinutes : 0;

      const grossMin = Number.isFinite(e.grossMinutes) ? e.grossMinutes : 0;
      const netMin = Math.max(0, Math.round(grossMin) - pauseThisRow);

      details.push({
        sortKey: `${d}T${start}`,
        cols: [
          d,
          weekdayShortDE(d),
          "ARBEIT",
          h?.name ?? "",
          start,
          end,
          grossMin,
          pauseThisRow,
          isFirstOfDay ? (breakInfo.auto ? "ja" : "nein") : "",
          netMin,
          e.travelMinutes ?? 0,
          getGermanTranslatedText(e.activity, e.activityTranslations),
          getGermanTranslatedText(e.location, e.locationTranslations),
          formatGermanDateTime(e.createdAt),
        ],
      });
    }

for (const a of b.absences) {
  const d = dateOnly(a.absenceDate);
  const h = holidayMap.get(d);

  const createdAt =
    a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);

  details.push({
    sortKey: `${d}T99:90`,
    cols: [
      d,
      weekdayShortDE(d),
      a.type === "SICK" ? "KRANK" : "URLAUB",
      h?.name ?? "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      formatGermanDateTime(createdAt),
    ],
  });
}

    if (rangeISO) {
      for (const d of allDaysInRange) {
        const h = holidayMap.get(d);
        if (!h) continue;
        if (isWeekendUTC(d)) continue;

        details.push({
          sortKey: `${d}T99:80`,
          cols: [d, weekdayShortDE(d), "FEIERTAG", h.name, "", "", "", "", "", "", "", "", "", ""],
        });
      }
    }

    details.sort((x, y) => x.sortKey.localeCompare(y.sortKey));
    for (const row of details) lines.push(row.cols);

    lines.push([]);
    lines.push([]);
  }

  if (blocks.length === 0) {
    lines.push(["Keine Daten im gewählten Zeitraum."]);
  }

  return buildCsvLines(lines);
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sessionUserId = getSessionUserId(session);
    if (!sessionUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const me = await prisma.appUser.findUnique({
      where: { id: sessionUserId },
      select: {
        role: true,
        isActive: true,
        companyId: true,
        company: {
          select: {
            subdomain: true,
          },
        },
      },
    });

    if (!me?.isActive) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (me.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const filePrefix = companyFilePrefix(me.company?.subdomain);
    const state = (searchParams.get("state") ?? "BW").trim().toUpperCase();

    const group = (searchParams.get("group") ?? "all").trim(); // all | perEmployee | singleEmployee
    const userId = (searchParams.get("userId") ?? "").trim();

    const isAll = group === "all";
    const isPerEmployee = group === "perEmployee";
    const isSingle = group === "singleEmployee";

    if (!isAll && !isPerEmployee && !isSingle) {
      return NextResponse.json({ error: "group muss all | perEmployee | singleEmployee sein" }, { status: 400 });
    }

    if (isSingle && !userId) {
      return NextResponse.json({ error: "userId fehlt (bei group=singleEmployee)" }, { status: 400 });
    }

    const scope = (searchParams.get("scope") ?? "").trim(); // month | year | ""
    const month = (searchParams.get("month") ?? "").trim();
    const yearStr = (searchParams.get("year") ?? "").trim();
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    // YEAR -> ZIP
    if (scope === "year") {
      if (!isValidYYYY(yearStr)) {
        return NextResponse.json({ error: "year muss YYYY sein (z.B. 2026)" }, { status: 400 });
      }

      const year = Number(yearStr);
      const zip = new JSZip();

      const employees = isPerEmployee
          ? await prisma.appUser.findMany({
              where: {
                isActive: true,
                role: "EMPLOYEE",
                companyId: me.companyId,
              },
              select: { id: true, fullName: true },
              orderBy: { fullName: "asc" },
            })
        : [];

      for (let m = 1; m <= 12; m++) {
        const key = `${year}-${pad2(m)}`;
        const start = new Date(Date.UTC(year, m - 1, 1));
        const endExclusive = new Date(Date.UTC(year, m, 1));
        const endInclusive = new Date(endExclusive.getTime() - 1);

        const fromISO = `${year}-${pad2(m)}-01`;
        const toISO = dateOnly(endInclusive);

        if (isAll) {
          const data = await loadData(start, endInclusive, null, me.companyId);
          const csv = buildPayrollCsv(data, key, { fromISO, toISO, state });
          zip.file(`${key}_payroll.csv`, csv);
          continue;
        }

        if (isSingle) {
          const emp = await prisma.appUser.findFirst({
            where: {
              id: userId,
              companyId: me.companyId,
            },
            select: { fullName: true, role: true, isActive: true },
          });

          if (!emp?.isActive || emp.role !== "EMPLOYEE") {
            return NextResponse.json({ error: "Ungültiger Mitarbeiter" }, { status: 400 });
          }

          const data = await loadData(start, endInclusive, userId, me.companyId);
          const csv = buildPayrollCsv(data, key, { fromISO, toISO, state });
          zip.file(`${key}_${safeFileName(emp.fullName)}_payroll.csv`, csv);
          continue;
        }

        for (const e of employees) {
          const data = await loadData(start, endInclusive, e.id, me.companyId);
          const csv = buildPayrollCsv(data, key, { fromISO, toISO, state });
          zip.file(`${key}_${safeFileName(e.fullName)}_payroll.csv`, csv);
        }
      }

      const uint8 = await zip.generateAsync({ type: "uint8array" });
      const ab = new ArrayBuffer(uint8.byteLength);
      new Uint8Array(ab).set(uint8);

      const filename = isAll
        ? `${filePrefix}_payroll_${year}.zip`
        : isSingle
        ? `${filePrefix}_payroll_${year}_${userId}.zip`
        : `${filePrefix}_payroll_${year}_pro-mitarbeiter.zip`;

      return new Response(ab, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": buildContentDisposition(filename),
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // MONTH
    if (scope === "month") {
      if (!isValidYYYYMM(month)) {
        return NextResponse.json({ error: "month muss YYYY-MM sein (z.B. 2026-03)" }, { status: 400 });
      }

      const { start, endInclusive } = monthRangeFromYYYYMM(month);
      const fromISO = `${month}-01`;
      const toISO = dateOnly(endInclusive);

      if (isAll) {
        const data = await loadData(start, endInclusive, null, me.companyId);
        const csv = buildPayrollCsv(data, month, { fromISO, toISO, state });
        const filename = `${filePrefix}_payroll_${month}.csv`;

        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": buildContentDisposition(filename),
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          },
        });
      }

      if (isSingle) {
        const emp = await prisma.appUser.findFirst({
          where: {
            id: userId,
            companyId: me.companyId,
          },
          select: { fullName: true, role: true, isActive: true },
        });

        if (!emp?.isActive || emp.role !== "EMPLOYEE") {
          return NextResponse.json({ error: "Ungültiger Mitarbeiter" }, { status: 400 });
        }

        const data = await loadData(start, endInclusive, userId, me.companyId);
        const csv = buildPayrollCsv(data, month, { fromISO, toISO, state });
        const filename = `${filePrefix}_payroll_${month}_${safeFileName(emp.fullName)}.csv`;

        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": buildContentDisposition(filename),
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          },
        });
      }

      const employees = await prisma.appUser.findMany({
        where: {
          isActive: true,
          role: "EMPLOYEE",
          companyId: me.companyId,
        },
        select: { id: true, fullName: true },
        orderBy: { fullName: "asc" },
      });

      const zip = new JSZip();

      for (const e of employees) {
        const data = await loadData(start, endInclusive, e.id, me.companyId);
        const csv = buildPayrollCsv(data, `${month} · ${e.fullName}`, { fromISO, toISO, state });
        zip.file(`${month}_${safeFileName(e.fullName)}_payroll.csv`, csv);
      }

      const uint8 = await zip.generateAsync({ type: "uint8array" });
      const ab = new ArrayBuffer(uint8.byteLength);
      new Uint8Array(ab).set(uint8);

      const filename = `${filePrefix}_payroll_${month}_pro-mitarbeiter.zip`;

      return new Response(ab, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": buildContentDisposition(filename),
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // CUSTOM RANGE oder ALLES
    const rangeFrom = fromStr ? new Date(`${fromStr}T00:00:00.000Z`) : null;
    const rangeTo = toStr ? new Date(`${toStr}T23:59:59.999Z`) : null;

    const label =
      fromStr && toStr
        ? `${fromStr} bis ${toStr}`
        : fromStr
        ? `ab ${fromStr}`
        : toStr
        ? `bis ${toStr}`
        : "ALLE DATEN";

    if (isSingle) {
      const emp = await prisma.appUser.findFirst({
        where: {
          id: userId,
          companyId: me.companyId,
        },
        select: {
          id: true,
          role: true,
          isActive: true,
        },
      });

      if (!emp || !emp.isActive || emp.role !== "EMPLOYEE") {
        return NextResponse.json({ error: "Ungültiger Mitarbeiter" }, { status: 400 });
      }
    }
    
        const data = await loadData(
      rangeFrom,
      rangeTo,
      isSingle ? userId : null,
      me.companyId
    );

    const csv =
      fromStr && toStr
        ? buildPayrollCsv(data, label, { fromISO: fromStr, toISO: toStr, state })
        : buildPayrollCsv(data, label);

    const filename = `${filePrefix}_payroll_${fromStr ?? "all"}_${toStr ?? "all"}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": buildContentDisposition(filename),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}