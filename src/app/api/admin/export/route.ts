// src/app/api/admin/export/route.ts
import { NextResponse } from "next/server";
import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Holidays from "date-holidays";

/** === Payroll Settings (anpassen falls nötig) === */
const STANDARD_DAY_HOURS = 8; // Tagessoll für bezahlte Tage (Urlaub/Krank/Feiertag)
const ROUND_TO_MINUTES = 15; // z.B. 15 = Viertelstunde (0,25h), 5 = 5-Minuten, 1 = Minuten-genau

type SessionLike = {
  userId?: string;
  user?: { id?: string };
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

function isoDayUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function loadData(from: Date | null, to: Date | null, userId: string | null) {
  const entriesWhere =
    from || to || userId
      ? {
          ...(userId ? { userId } : {}),
          workDate: {
            gte: from ?? undefined,
            lte: to ?? undefined,
          },
        }
      : {};

  const absWhere =
    from || to || userId
      ? {
          ...(userId ? { userId } : {}),
          absenceDate: {
            gte: from ?? undefined,
            lte: to ?? undefined,
          },
        }
      : {};

  const [entries, absences] = await Promise.all([
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
  ]);

  return { entries, absences };
}

type Loaded = Awaited<ReturnType<typeof loadData>>;

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
};

function groupByUser(data: Loaded): UserBlock[] {
  const map = new Map<string, UserBlock>();

  for (const e of data.entries) {
    const userId = e.userId;
    const name = e.user.fullName;
    const cur =
      map.get(userId) ?? {
        userId,
        name,
        entries: [],
        absences: [],
      };

    cur.entries.push(e);
    map.set(userId, cur);
  }

  for (const a of data.absences) {
    const userId = a.userId;
    const name = a.user.fullName;
    const cur =
      map.get(userId) ?? {
        userId,
        name,
        entries: [],
        absences: [],
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
  lines.push(["Export erstellt am (UTC)", new Date().toISOString()]);
  lines.push([]);

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

    const sickDates = new Set(
      b.absences.filter((a) => a.type === "SICK").map((a) => dateOnly(a.absenceDate))
    );

    const vacationDates = new Set(
      b.absences.filter((a) => a.type === "VACATION").map((a) => dateOnly(a.absenceDate))
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

    const expectedMinutes = expectedWorkdays * STANDARD_DAY_HOURS * 60;

    const paidAbsenceDays = sickDates.size + vacationDates.size;
    const paidAbsenceMinutes = paidAbsenceDays * STANDARD_DAY_HOURS * 60;

    const paidHolidayDaysNotWorked = Array.from(holidayDates).filter((d) => !workedDates.has(d)).length;
    const paidHolidayMinutes = paidHolidayDaysNotWorked * STANDARD_DAY_HOURS * 60;

    const workedHours = totalNetMinutes / 60;
    const expectedHours = expectedMinutes / 60;

    const payableMinutesRaw = totalNetMinutes + paidAbsenceMinutes + paidHolidayMinutes;
    const payableMinutesRounded = roundMinutes(payableMinutesRaw, ROUND_TO_MINUTES);
    const payableHoursRaw = payableMinutesRaw / 60;
    const payableHoursRounded = payableMinutesRounded / 60;
    const overtimeHours = (payableMinutesRaw - expectedMinutes) / 60;

    lines.push(["Mitarbeiter", b.name]);

    lines.push([
      "Summary",
      "Soll-Arbeitstage",
      "Sollstunden",
      "Arbeitsstunden (Ist)",
      "Überstunden (Ist-Soll)",
      "Fahrtminuten",
      "Urlaubstage",
      "Krankheitstage",
      "Feiertage (Werktag)",
      "Bezahlte Abw.-Tage (U+K)",
      "Bezahlte Abw.-Stunden",
      "Bezahlte Feiertage (nicht gearbeitet)",
      "Bezahlte Stunden (roh)",
      "Bezahlte Stunden (gerundet)",
    ]);

    lines.push([
      "",
      rangeISO ? expectedWorkdays : "",
      rangeISO ? formatHoursDE(expectedHours) : "",
      formatHoursDE(workedHours),
      rangeISO ? formatHoursDE(overtimeHours) : "",
      totalTravelMinutes,
      vacationDates.size,
      sickDates.size,
      rangeISO ? holidayDates.size : "",
      paidAbsenceDays,
      formatHoursDE(paidAbsenceMinutes / 60),
      rangeISO ? paidHolidayDaysNotWorked : "",
      formatHoursDE(payableHoursRaw),
      formatHoursDE(payableHoursRounded),
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
      "ErstelltAm",
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
          e.activity,
          e.location,
          e.createdAt.toISOString(),
        ],
      });
    }

    for (const a of b.absences) {
      const d = dateOnly(a.absenceDate);
      const h = holidayMap.get(d);

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
          a.createdAt.toISOString(),
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
      select: { role: true, isActive: true },
    });

    if (!me?.isActive) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (me.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
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
            where: { isActive: true, role: "EMPLOYEE" },
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
          const data = await loadData(start, endInclusive, null);
          const csv = buildPayrollCsv(data, key, { fromISO, toISO, state });
          zip.file(`${key}_payroll.csv`, csv);
          continue;
        }

        if (isSingle) {
          const emp = await prisma.appUser.findUnique({
            where: { id: userId },
            select: { fullName: true, role: true, isActive: true },
          });

          if (!emp?.isActive || emp.role !== "EMPLOYEE") {
            return NextResponse.json({ error: "Ungültiger Mitarbeiter" }, { status: 400 });
          }

          const data = await loadData(start, endInclusive, userId);
          const csv = buildPayrollCsv(data, key, { fromISO, toISO, state });
          zip.file(`${key}_${safeFileName(emp.fullName)}_payroll.csv`, csv);
          continue;
        }

        for (const e of employees) {
          const data = await loadData(start, endInclusive, e.id);
          const csv = buildPayrollCsv(data, key, { fromISO, toISO, state });
          zip.file(`${key}_${safeFileName(e.fullName)}_payroll.csv`, csv);
        }
      }

      const uint8 = await zip.generateAsync({ type: "uint8array" });
      const ab = new ArrayBuffer(uint8.byteLength);
      new Uint8Array(ab).set(uint8);

      const filename = isAll
        ? `ma-fliesen_payroll_${year}.zip`
        : isSingle
        ? `ma-fliesen_payroll_${year}_${userId}.zip`
        : `ma-fliesen_payroll_${year}_pro-mitarbeiter.zip`;

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
        const data = await loadData(start, endInclusive, null);
        const csv = buildPayrollCsv(data, month, { fromISO, toISO, state });
        const filename = `ma-fliesen_payroll_${month}.csv`;

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
        const emp = await prisma.appUser.findUnique({
          where: { id: userId },
          select: { fullName: true, role: true, isActive: true },
        });

        if (!emp?.isActive || emp.role !== "EMPLOYEE") {
          return NextResponse.json({ error: "Ungültiger Mitarbeiter" }, { status: 400 });
        }

        const data = await loadData(start, endInclusive, userId);
        const csv = buildPayrollCsv(data, month, { fromISO, toISO, state });
        const filename = `ma-fliesen_payroll_${month}_${safeFileName(emp.fullName)}.csv`;

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
        where: { isActive: true, role: "EMPLOYEE" },
        select: { id: true, fullName: true },
        orderBy: { fullName: "asc" },
      });

      const zip = new JSZip();

      for (const e of employees) {
        const data = await loadData(start, endInclusive, e.id);
        const csv = buildPayrollCsv(data, `${month} · ${e.fullName}`, { fromISO, toISO, state });
        zip.file(`${month}_${safeFileName(e.fullName)}_payroll.csv`, csv);
      }

      const uint8 = await zip.generateAsync({ type: "uint8array" });
      const ab = new ArrayBuffer(uint8.byteLength);
      new Uint8Array(ab).set(uint8);

      const filename = `ma-fliesen_payroll_${month}_pro-mitarbeiter.zip`;

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

    const data = await loadData(rangeFrom, rangeTo, isSingle ? userId : null);

    const csv =
      fromStr && toStr
        ? buildPayrollCsv(data, label, { fromISO: fromStr, toISO: toStr, state })
        : buildPayrollCsv(data, label);

    const filename = `ma-fliesen_payroll_${fromStr ?? "all"}_${toStr ?? "all"}.csv`;

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