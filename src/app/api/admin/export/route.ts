// src/app/api/admin/export/route.ts
import { NextResponse } from "next/server";
import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

function buildCsv(rows: Array<Record<string, unknown>>, headers: string[]): string {
  const sep = ";"; // Excel DE
  const head = headers.map((h) => csvEscape(h)).join(sep);
  const body = rows
    .map((r) => headers.map((h) => csvEscape(r[h])).join(sep))
    .join("\n");
  return "\ufeff" + head + "\n" + body + "\n"; // BOM für Umlaute in Excel
}

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function timeOnly(d: Date): string {
  return d.toISOString().slice(11, 16);
}

function decimalToString(x: unknown): string {
  if (x === null || x === undefined) return "";
  if (typeof x === "number") return String(x);
  if (typeof x === "string") return x;

  const obj = x as { toNumber?: () => number; toString?: () => string };
  if (typeof obj.toNumber === "function") return String(obj.toNumber());
  if (typeof obj.toString === "function") return obj.toString();
  return "";
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

const HEADERS = [
  "Typ",
  "Datum",
  "Mitarbeiter",
  "Start",
  "Ende",
  "Arbeitsminuten",
  "Fahrtminuten",
  "Kilometer",
  "Tätigkeit",
  "Ort",
  "ErstelltAm",
];

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

function buildRows(data: Awaited<ReturnType<typeof loadData>>) {
  const rows: Array<Record<string, unknown>> = [];

  for (const e of data.entries) {
    rows.push({
      Typ: "ARBEIT",
      Datum: dateOnly(e.workDate),
      Mitarbeiter: e.user.fullName,
      Start: timeOnly(e.startTime),
      Ende: timeOnly(e.endTime),
      Arbeitsminuten: e.workMinutes,
      Fahrtminuten: e.travelMinutes,
      Kilometer: decimalToString(e.distanceKm),
      Tätigkeit: e.activity,
      Ort: e.location,
      ErstelltAm: e.createdAt.toISOString(),
    });
  }

  for (const a of data.absences) {
    rows.push({
      Typ: a.type === "SICK" ? "KRANK" : "URLAUB",
      Datum: dateOnly(a.absenceDate),
      Mitarbeiter: a.user.fullName,
      Start: "",
      Ende: "",
      Arbeitsminuten: "",
      Fahrtminuten: "",
      Kilometer: "",
      Tätigkeit: "",
      Ort: "",
      ErstelltAm: a.createdAt.toISOString(),
    });
  }

  rows.sort((x, y) => {
    const d = String(x.Datum).localeCompare(String(y.Datum));
    if (d !== 0) return d;
    const m = String(x.Mitarbeiter).localeCompare(String(y.Mitarbeiter));
    if (m !== 0) return m;
    return String(x.Typ).localeCompare(String(y.Typ));
  });

  return rows;
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
        const rows = buildRows(data);
        const csv = buildCsv(rows, HEADERS);

        zip.file(`${key}.csv`, csv);
      }

      // ✅ TS-sicher: uint8array -> in *neues* ArrayBuffer kopieren (kein SharedArrayBuffer)
      const uint8 = await zip.generateAsync({ type: "uint8array" });
      const ab = new ArrayBuffer(uint8.byteLength);
      new Uint8Array(ab).set(uint8);

      const filename = `ma-fliesen_export_${year}.zip`;

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
        return NextResponse.json(
          { error: "month muss YYYY-MM sein (z.B. 2026-03)" },
          { status: 400 }
        );
      }

      const { start, endInclusive } = monthRangeFromYYYYMM(month);
      const data = await loadData(start, endInclusive);
      const rows = buildRows(data);
      const csv = buildCsv(rows, HEADERS);

      const filename = `ma-fliesen_export_${month}.csv`;

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
    const rangeFrom = fromStr ? new Date(fromStr) : null;
    const rangeTo = toStr ? new Date(toStr) : null;

    const data = await loadData(rangeFrom, rangeTo);
    const rows = buildRows(data);
    const csv = buildCsv(rows, HEADERS);

    const filename = `ma-fliesen_export_${fromStr ?? "all"}_${toStr ?? "all"}.csv`;

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