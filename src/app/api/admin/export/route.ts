import { NextResponse } from "next/server";
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
  // ISO: 2026-02-28T08:15:00.000Z → wir nehmen HH:MM
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

export async function GET(req: Request) {
  try {
    // Bei dir: getSession() ohne req
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUserId = getSessionUserId(session);
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Admincheck sicher über DB (weil Session keine role enthält)
    const me = await prisma.appUser.findUnique({
      where: { id: sessionUserId },
      select: { role: true, isActive: true },
    });

    if (!me?.isActive) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (me.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from"); // YYYY-MM-DD
    const to = searchParams.get("to");     // YYYY-MM-DD

    const entriesWhere =
      from || to
        ? {
            workDate: {
              gte: from ? new Date(from) : undefined,
              lte: to ? new Date(to) : undefined,
            },
          }
        : {};

    const absWhere =
      from || to
        ? {
            absenceDate: {
              gte: from ? new Date(from) : undefined,
              lte: to ? new Date(to) : undefined,
            },
          }
        : {};

    // ✅ Daten holen (alle Mitarbeiter, weil Admin-Export)
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

    // ✅ Export-CSV rows
    const rows: Array<Record<string, unknown>> = [];

    for (const e of entries) {
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

    for (const a of absences) {
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

    // Sortierung nach Datum, dann Mitarbeiter, dann Typ
    rows.sort((x, y) => {
      const d = String(x.Datum).localeCompare(String(y.Datum));
      if (d !== 0) return d;
      const m = String(x.Mitarbeiter).localeCompare(String(y.Mitarbeiter));
      if (m !== 0) return m;
      return String(x.Typ).localeCompare(String(y.Typ));
    });

    const headers = [
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

    const csv = buildCsv(rows, headers);

    const filename = `ma-fliesen_export_${from ?? "all"}_${to ?? "all"}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}