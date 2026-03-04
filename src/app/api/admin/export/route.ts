// src/app/api/admin/export/route.ts
import { NextResponse } from "next/server";
import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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


function isValidYYYYMM(s: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}

function isValidYYYY(s: string) {
  return /^\d{4}$/.test(s);
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function monthRangeFromYYYYMM(month: string) {
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
  // 2 Nachkommastellen, deutsches Komma
  return hours.toFixed(2).replace(".", ",");
}

function roundMinutes(minutes: number, stepMinutes: number): number {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  const step = Math.max(1, Math.floor(stepMinutes));
  return Math.round(minutes / step) * step;
}

function addDaysUTC(d: Date, days: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

function isWeekendUTC(yyyyMmDd: string): boolean {
  const d = new Date(`${yyyyMmDd}T00:00:00.000Z`);
  const wd = d.getUTCDay(); // 0=So ... 6=Sa
  return wd === 0 || wd === 6;
}

/** ===== Easter (Meeus/Jones/Butcher) ===== */
function easterSundayUTC(year: number): Date {
  // returns Easter Sunday at 00:00 UTC
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/** ===== Feiertage (Default: Baden-Württemberg) ===== */
type HolidayInfo = { name: string };

function holidaysBWForYear(year: number): Map<string, HolidayInfo> {
  const map = new Map<string, HolidayInfo>();

  const fixed: Array<{ m: number; d: number; name: string }> = [
    { m: 1, d: 1, name: "Neujahr" },
    { m: 1, d: 6, name: "Heilige Drei Könige" }, // BW
    { m: 5, d: 1, name: "Tag der Arbeit" },
    { m: 10, d: 3, name: "Tag der Deutschen Einheit" },
    { m: 11, d: 1, name: "Allerheiligen" }, // BW
    { m: 12, d: 25, name: "1. Weihnachtstag" },
    { m: 12, d: 26, name: "2. Weihnachtstag" },
  ];

  for (const f of fixed) {
    const iso = `${year}-${pad2(f.m)}-${pad2(f.d)}`;
    map.set(iso, { name: f.name });
  }

  const easter = easterSundayUTC(year);
  const karfreitag = addDaysUTC(easter, -2);
  const ostermontag = addDaysUTC(easter, +1);
  const christiHimmelfahrt = addDaysUTC(easter, +39);
  const pfingstmontag = addDaysUTC(easter, +50);
  const fronleichnam = addDaysUTC(easter, +60); // BW

  const movable: Array<{ date: Date; name: string }> = [
    { date: karfreitag, name: "Karfreitag" },
    { date: ostermontag, name: "Ostermontag" },
    { date: christiHimmelfahrt, name: "Christi Himmelfahrt" },
    { date: pfingstmontag, name: "Pfingstmontag" },
    { date: fronleichnam, name: "Fronleichnam" },
  ];

  for (const m of movable) {
    map.set(dateOnly(m.date), { name: m.name });
  }

  return map;
}

function buildHolidayMapBW(fromISO: string, toISO: string): Map<string, HolidayInfo> {
  const fromY = Number(fromISO.slice(0, 4));
  const toY = Number(toISO.slice(0, 4));
  const res = new Map<string, HolidayInfo>();
  for (let y = fromY; y <= toY; y++) {
    const yearMap = holidaysBWForYear(y);
    for (const [k, v] of yearMap.entries()) res.set(k, v);
  }
  return res;
}

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

async function loadData(from: Date | null, to: Date | null) {
  const entriesWhere =
    from || to
      ? {
          workDate: {
            gte: from ?? undefined,
            lte: to ?? undefined,
          },
        }
      : {};

  const absWhere =
    from || to
      ? {
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
function buildPayrollCsv(data: Loaded, labelPeriod: string, rangeISO?: { fromISO: string; toISO: string }) {
  const blocks = groupByUser(data);

  // Feiertage nur dann sauber zählen/ausgeben, wenn wir einen klaren Range haben (Monat/Jahr/Custom)
  const holidayMap =
    rangeISO && rangeISO.fromISO && rangeISO.toISO ? buildHolidayMapBW(rangeISO.fromISO, rangeISO.toISO) : new Map();

  const allDaysInRange = rangeISO ? eachDayISOInclusive(rangeISO.fromISO, rangeISO.toISO) : [];

  const lines: Array<Array<unknown>> = [];

  // Kopf
  lines.push(["Payroll Export"]);
  lines.push(["Zeitraum", labelPeriod]);
  lines.push(["Standard Tagessoll (h)", STANDARD_DAY_HOURS]);
  lines.push(["Rundung (Minuten)", ROUND_TO_MINUTES]);
  lines.push(["Export erstellt am (UTC)", new Date().toISOString()]);
  lines.push([]);

  for (const b of blocks) {
    const totalWorkMinutes = b.entries.reduce((s, e) => s + (Number.isFinite(e.workMinutes) ? e.workMinutes : 0), 0);
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

    // Feiertage im Range (nur Werktage zählen, weil Wochenenden i.d.R. irrelevant)
    const holidayDates = new Set<string>();
    if (rangeISO) {
      for (const d of allDaysInRange) {
        const h = holidayMap.get(d);
        if (!h) continue;
        if (isWeekendUTC(d)) continue;
        holidayDates.add(d);
      }
    }

    // Soll-Arbeitstage im Zeitraum (Mo-Fr, aber Feiertage zählen NICHT als Soll-Arbeitstag)
    // (sonst wären Feiertage "zusätzliche Sollstunden", was payroll falsch macht)
    let expectedWorkdays = 0;
    if (rangeISO) {
      for (const d of allDaysInRange) {
        if (isWeekendUTC(d)) continue;
        if (holidayDates.has(d)) continue;
        expectedWorkdays += 1;
      }
    }

    const expectedMinutes = expectedWorkdays * STANDARD_DAY_HOURS * 60;

    // Bezahlte Abwesenheit (Urlaub+Krank) -> Stunden
    const paidAbsenceDays = sickDates.size + vacationDates.size;
    const paidAbsenceMinutes = paidAbsenceDays * STANDARD_DAY_HOURS * 60;

    // Bezahlte Feiertage:
    // - wenn an Feiertag gearbeitet wurde, ist es sowieso in Arbeitszeit enthalten
    // - sonst als bezahlter Tag
    const paidHolidayDaysNotWorked = Array.from(holidayDates).filter((d) => !workedDates.has(d)).length;
    const paidHolidayMinutes = paidHolidayDaysNotWorked * STANDARD_DAY_HOURS * 60;

    const workedHours = totalWorkMinutes / 60;
    const expectedHours = expectedMinutes / 60;
    const overtimeHours = (totalWorkMinutes - expectedMinutes) / 60;

    // "Wie viele Stunden bezahlt werden sollen"
    // => Arbeitszeit + bezahlte Abwesenheit + bezahlte Feiertage (die nicht gearbeitet wurden)
    const payableMinutesRaw = totalWorkMinutes + paidAbsenceMinutes + paidHolidayMinutes;
    const payableMinutesRounded = roundMinutes(payableMinutesRaw, ROUND_TO_MINUTES);
    const payableHoursRaw = payableMinutesRaw / 60;
    const payableHoursRounded = payableMinutesRounded / 60;

    lines.push(["Mitarbeiter", b.name]);

    // Summary Kopf
    lines.push([
      "Summary",
      "Soll-Arbeitstage",
      "Sollstunden",
      "Arbeitsstunden (Ist)",
      "Überstunden (Ist-Soll)",
      "Fahrtminuten",
      "Kilometer",
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

    // Detailkopf
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
      "Kilometer",
      "Tätigkeit",
      "Ort",
      "ErstelltAm",
    ]);

    type DetailRow = { sortKey: string; cols: Array<unknown> };
    const details: DetailRow[] = [];

    // Arbeit
    for (const e of b.entries) {
      const d = dateOnly(e.workDate);
      const start = timeOnly(e.startTime);
      const end = timeOnly(e.endTime);
      const h = holidayMap.get(d);

      details.push({
        sortKey: `${d}T${start}`,
        cols: [
          d,
          weekdayShortDE(d),
          "ARBEIT",
          h?.name ?? "",
          start,
          end,
          e.workMinutes,
          e.travelMinutes,
          e.workMinutes,
          e.travelMinutes,
          e.grossMinutes ?? "",
          e.breakMinutes ?? "",
          (e.breakAuto ?? false) ? "ja" : "nein",
          e.workMinutes ?? "",
          e.travelMinutes,
          e.activity,
          e.location,
          e.createdAt.toISOString(),
        ],
      });
    }

    // Abwesenheiten
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
          a.createdAt.toISOString(),
        ],
      });
    }

    // Feiertage als eigene Zeile (damit es “mit eingetragen” ist)
    if (rangeISO) {
      for (const d of allDaysInRange) {
        const h = holidayMap.get(d);
        if (!h) continue;
        if (isWeekendUTC(d)) continue;

        // Wenn bereits Arbeit oder Abwesenheit am Tag existiert, trotzdem als Zeile ausgeben (für Transparenz)
        // (Payroll kann dann entscheiden: Feiertag gearbeitet / Feiertag krank etc.)
        details.push({
          sortKey: `${d}T99:80`,
          cols: [
            d,
            weekdayShortDE(d),
            "FEIERTAG",
            h.name,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ],
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

    const scope = (searchParams.get("scope") ?? "").trim(); // "month" | "year" | ""
    const month = (searchParams.get("month") ?? "").trim(); // YYYY-MM
    const yearStr = (searchParams.get("year") ?? "").trim(); // YYYY

    const fromStr = searchParams.get("from"); // YYYY-MM-DD
    const toStr = searchParams.get("to"); // YYYY-MM-DD

    // =========================
    // YEAR -> ZIP (12 CSVs)
    // =========================
    if (scope === "year") {
      if (!isValidYYYY(yearStr)) {
        return NextResponse.json({ error: "year muss YYYY sein (z.B. 2026)" }, { status: 400 });
      }

      const year = Number(yearStr);
      const zip = new JSZip();

      for (let m = 1; m <= 12; m++) {
        const key = `${year}-${pad2(m)}`;
        const start = new Date(Date.UTC(year, m - 1, 1));
        const endExclusive = new Date(Date.UTC(year, m, 1));
        const endInclusive = new Date(endExclusive.getTime() - 1);

        const data = await loadData(start, endInclusive);
        const fromISO = `${year}-${pad2(m)}-01`;
        const toISO = dateOnly(endInclusive);

        const csv = buildPayrollCsv(data, key, { fromISO, toISO });
        zip.file(`${key}_payroll.csv`, csv);
      }

      const uint8 = await zip.generateAsync({ type: "uint8array" });
      const ab = new ArrayBuffer(uint8.byteLength);
      new Uint8Array(ab).set(uint8);

      const filename = `ma-fliesen_payroll_${year}.zip`;

      return new Response(ab, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // =========================
    // MONTH -> 1 CSV
    // =========================
    if (scope === "month") {
      if (!isValidYYYYMM(month)) {
        return NextResponse.json({ error: "month muss YYYY-MM sein (z.B. 2026-03)" }, { status: 400 });
      }

      const { start, endInclusive } = monthRangeFromYYYYMM(month);
      const data = await loadData(start, endInclusive);

      const fromISO = `${month}-01`;
      const toISO = dateOnly(endInclusive);

      const csv = buildPayrollCsv(data, month, { fromISO, toISO });

      const filename = `ma-fliesen_payroll_${month}.csv`;

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // =========================
    // CUSTOM RANGE oder ALLES
    // =========================
    const rangeFrom = fromStr ? new Date(`${fromStr}T00:00:00.000Z`) : null;
    const rangeTo = toStr ? new Date(`${toStr}T23:59:59.999Z`) : null;

    const label =
      fromStr && toStr ? `${fromStr} bis ${toStr}` : fromStr ? `ab ${fromStr}` : toStr ? `bis ${toStr}` : "ALLE DATEN";

    const data = await loadData(rangeFrom, rangeTo);

    const csv =
      fromStr && toStr ? buildPayrollCsv(data, label, { fromISO: fromStr, toISO: toStr }) : buildPayrollCsv(data, label);

    const filename = `ma-fliesen_payroll_${fromStr ?? "all"}_${toStr ?? "all"}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}