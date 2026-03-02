// src/app/api/absences/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AbsenceType, Role } from "@prisma/client";

type AbsenceBody = {
  startDate?: unknown; // YYYY-MM-DD
  endDate?: unknown; // YYYY-MM-DD
  type?: unknown; // "VACATION" | "SICK"
  userId?: unknown; // optional (nur Admin)
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function isAbsenceType(v: string): v is AbsenceType {
  return v === "VACATION" || v === "SICK";
}

function dateOnlyUTC(yyyyMmDd: string) {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

function toIsoDateUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function eachDayInclusive(from: Date, to: Date) {
  const res: Date[] = [];
  const cur = new Date(from);
  while (cur <= to) {
    res.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return res;
}

function isYYYYMM(v: string) {
  return /^\d{4}-\d{2}$/.test(v);
}

function isYYYYMMDD(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

type AbsenceDTO = {
  id: string;
  absenceDate: string; // YYYY-MM-DD
  type: "VACATION" | "SICK";
  user: { id: string; fullName: string };
};

type AbsenceDayGroup = {
  date: string; // YYYY-MM-DD
  items: AbsenceDTO[];
};

type AbsenceUserSummary = {
  user: { id: string; fullName: string };
  sickDays: number;
  vacationDays: number;
  totalDays: number;
};

function okJson(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/**
 * GET /api/absences
 *
 * Query:
 * - month=YYYY-MM (optional)
 * - from=YYYY-MM-DD (optional)  -> Alternative zu month
 * - to=YYYY-MM-DD (optional)    -> inclusive gedacht, intern +1 Tag als lt
 * - userId=... (optional, nur Admin)
 *
 * Response:
 * {
 *   absences: AbsenceDTO[],
 *   groupsByDay: AbsenceDayGroup[],
 *   summaryByUser: AbsenceUserSummary[],
 *   range?: { from: string; to: string } // ISO YYYY-MM-DD .. YYYY-MM-DD (inclusive)
 * }
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return okJson({ error: "Nicht eingeloggt" }, { status: 401 });

  const url = new URL(req.url);
  const month = (url.searchParams.get("month") ?? "").trim(); // YYYY-MM
  const fromQ = (url.searchParams.get("from") ?? "").trim(); // YYYY-MM-DD
  const toQ = (url.searchParams.get("to") ?? "").trim(); // YYYY-MM-DD
  const userIdQ = (url.searchParams.get("userId") ?? "").trim();

  const isAdmin = session.role === Role.ADMIN;

  // Wer darf abgefragt werden?
  // - Admin: optional filter via userId
  // - Employee: immer nur eigene
  const effectiveUserWhere = isAdmin
    ? userIdQ
      ? { userId: userIdQ }
      : {}
    : { userId: session.userId };

  // Zeitraum bestimmen
  let from: Date | undefined;
  let toExclusive: Date | undefined;
  let rangeInfo: { from: string; to: string } | undefined;

  if (month && isYYYYMM(month)) {
    const [yStr, mStr] = month.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    toExclusive = new Date(Date.UTC(y, m, 1, 0, 0, 0)); // erster Tag Folgemonat
    // rangeInfo inclusive:
    const lastDay = new Date(toExclusive);
    lastDay.setUTCDate(lastDay.getUTCDate() - 1);
    rangeInfo = { from: toIsoDateUTC(from), to: toIsoDateUTC(lastDay) };
  } else if (fromQ && toQ && isYYYYMMDD(fromQ) && isYYYYMMDD(toQ)) {
    const fromD = dateOnlyUTC(fromQ);
    const toD = dateOnlyUTC(toQ);
    if (toD < fromD) {
      return okJson({ error: "to darf nicht vor from liegen" }, { status: 400 });
    }
    from = fromD;
    // toExclusive = toD + 1 Tag
    toExclusive = new Date(toD);
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);

    rangeInfo = { from: fromQ, to: toQ };
  }

  const rows = await prisma.absence.findMany({
    where: {
      ...effectiveUserWhere,
      ...(from && toExclusive ? { absenceDate: { gte: from, lt: toExclusive } } : {}),
    },
    include: { user: { select: { id: true, fullName: true } } },
    orderBy: [{ absenceDate: "asc" }],
  });

  const absences: AbsenceDTO[] = rows.map((a) => ({
    id: a.id,
    absenceDate: toIsoDateUTC(a.absenceDate),
    type: a.type === "SICK" ? "SICK" : "VACATION",
    user: { id: a.user.id, fullName: a.user.fullName },
  }));

  // ✅ Gruppierung nach Tag (für Admin-Übersicht)
  const byDay = new Map<string, AbsenceDTO[]>();
  for (const a of absences) {
    const arr = byDay.get(a.absenceDate) ?? [];
    arr.push(a);
    byDay.set(a.absenceDate, arr);
  }

  const groupsByDay: AbsenceDayGroup[] = Array.from(byDay.entries())
    .sort(([d1], [d2]) => (d1 < d2 ? -1 : 1))
    .map(([date, items]) => ({
      date,
      // optional: pro Tag Name sortiert
      items: items.slice().sort((x, y) => x.user.fullName.localeCompare(y.user.fullName)),
    }));

  // ✅ Summary je Mitarbeiter (für Admin "Nach Mitarbeiter")
  const byUser = new Map<
    string,
    { user: { id: string; fullName: string }; sickDays: number; vacationDays: number }
  >();

  for (const a of absences) {
    const cur =
      byUser.get(a.user.id) ?? {
        user: { id: a.user.id, fullName: a.user.fullName },
        sickDays: 0,
        vacationDays: 0,
      };

    if (a.type === "SICK") cur.sickDays += 1;
    else cur.vacationDays += 1;

    byUser.set(a.user.id, cur);
  }

  const summaryByUser: AbsenceUserSummary[] = Array.from(byUser.values())
    .map((u) => ({
      user: u.user,
      sickDays: u.sickDays,
      vacationDays: u.vacationDays,
      totalDays: u.sickDays + u.vacationDays,
    }))
    .sort((a, b) => a.user.fullName.localeCompare(b.user.fullName));

  return okJson({
    absences,
    groupsByDay,
    summaryByUser,
    ...(rangeInfo ? { range: rangeInfo } : {}),
  });
}

/**
 * POST /api/absences
 *
 * Body:
 * {
 *   startDate: "YYYY-MM-DD",
 *   endDate: "YYYY-MM-DD",
 *   type: "SICK"|"VACATION",
 *   userId?: "..."   // optional, nur Admin
 * }
 *
 * Legt pro Tag einen Datensatz an (skipDuplicates=true).
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return okJson({ error: "Nicht eingeloggt" }, { status: 401 });

  const raw = (await req.json().catch(() => null)) as unknown;
  const body: AbsenceBody = isRecord(raw) ? (raw as AbsenceBody) : {};

  const startDate = getString(body.startDate);
  const endDate = getString(body.endDate);
  const typeStr = getString(body.type);
  const userIdFromBody = getString(body.userId);

  if (!startDate || !endDate || !typeStr || !isYYYYMMDD(startDate) || !isYYYYMMDD(endDate) || !isAbsenceType(typeStr)) {
    return okJson({ error: "Ungültige Daten" }, { status: 400 });
  }

  const start = dateOnlyUTC(startDate);
  const end = dateOnlyUTC(endDate);

  if (end < start) {
    return okJson({ error: "Enddatum darf nicht vor Startdatum liegen." }, { status: 400 });
  }

  const isAdmin = session.role === Role.ADMIN;

  // ✅ Wer wird belegt?
  // - Admin darf userId setzen
  // - Employee nur sich selbst
  const targetUserId = isAdmin && userIdFromBody ? userIdFromBody : session.userId;

  // Optional: Admin darf nicht für inaktive User eintragen? (wenn du willst)
  // -> aktuell nicht erzwungen, damit es nicht blockiert.

  const days = eachDayInclusive(start, end);

  const result = await prisma.absence.createMany({
    data: days.map((d) => ({
      userId: targetUserId,
      absenceDate: d,
      type: typeStr,
    })),
    skipDuplicates: true,
  });

  return okJson({
    ok: true,
    requestedDays: days.length,
    created: result.count,
    skipped: days.length - result.count,
    userId: targetUserId,
  });
}

/**
 * DELETE /api/absences?id=...
 *
 * Löscht einen konkreten Datensatz (pro Tag).
 * - Admin: darf alles löschen
 * - Employee: nur eigene
 */
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return okJson({ error: "Nicht eingeloggt" }, { status: 401 });

  const url = new URL(req.url);
  const id = (url.searchParams.get("id") ?? "").trim();
  if (!id) return okJson({ error: "id fehlt" }, { status: 400 });

  const a = await prisma.absence.findUnique({ where: { id } });
  if (!a) return okJson({ error: "Nicht gefunden" }, { status: 404 });

  const isAdmin = session.role === Role.ADMIN;
  if (!isAdmin && a.userId !== session.userId) {
    return okJson({ error: "Nicht erlaubt" }, { status: 403 });
  }

  await prisma.absence.delete({ where: { id } });

  return okJson({ ok: true });
}