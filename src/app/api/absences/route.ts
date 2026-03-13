import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  AbsenceCompensation,
  AbsenceDayPortion,
  AbsenceType,
  Role,
} from "@prisma/client";

type AbsenceBody = {
  startDate?: unknown;
  endDate?: unknown;
  type?: unknown;
  dayPortion?: unknown;
  compensation?: unknown;
  userId?: unknown;
};

type AbsencePatchBody = {
  from?: unknown;
  to?: unknown;
  type?: unknown;
  dayPortion?: unknown;
  compensation?: unknown;

  newStartDate?: unknown;
  newEndDate?: unknown;
  newType?: unknown;
  newDayPortion?: unknown;
  newCompensation?: unknown;

  userId?: unknown;
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

function isAbsenceDayPortion(v: string): v is AbsenceDayPortion {
  return v === "FULL_DAY" || v === "HALF_DAY";
}

function isAbsenceCompensation(v: string): v is AbsenceCompensation {
  return v === "PAID" || v === "UNPAID";
}

function isYYYYMM(v: string): boolean {
  return /^\d{4}-\d{2}$/.test(v);
}

function isYYYYMMDD(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function dateOnlyUTC(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

function toIsoDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function eachDayInclusive(from: Date, to: Date): Date[] {
  const res: Date[] = [];
  const cur = new Date(from);
  while (cur <= to) {
    res.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return res;
}

type AbsenceDTO = {
  id: string;
  absenceDate: string;
  type: "VACATION" | "SICK";
  dayPortion: "FULL_DAY" | "HALF_DAY";
  compensation: "PAID" | "UNPAID";
  user: { id: string; fullName: string };
};

type AbsenceDayGroup = {
  date: string;
  items: AbsenceDTO[];
};

type AbsenceUserSummary = {
  user: { id: string; fullName: string };
  sickDays: number;
  vacationDays: number;
  unpaidVacationDays: number;
  totalDays: number;
};

function okJson(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}


export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return okJson({ error: "Nicht eingeloggt" }, { status: 401 });

  const url = new URL(req.url);
  const month = (url.searchParams.get("month") ?? "").trim();
  const fromQ = (url.searchParams.get("from") ?? "").trim();
  const toQ = (url.searchParams.get("to") ?? "").trim();
  const userIdQ = (url.searchParams.get("userId") ?? "").trim();

  const isAdmin = session.role === Role.ADMIN;

  const effectiveUserWhere = isAdmin
    ? userIdQ
      ? { userId: userIdQ }
      : {}
    : { userId: session.userId };

  let from: Date | undefined;
  let toExclusive: Date | undefined;
  let rangeInfo: { from: string; to: string } | undefined;

  if (month && isYYYYMM(month)) {
    const [yStr, mStr] = month.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    toExclusive = new Date(Date.UTC(y, m, 1, 0, 0, 0));
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
    toExclusive = new Date(toD);
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
    rangeInfo = { from: fromQ, to: toQ };
  }

  const rows = await prisma.absence.findMany({
    where: {
      ...effectiveUserWhere,
      ...(from && toExclusive
        ? { absenceDate: { gte: from, lt: toExclusive } }
        : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: [{ absenceDate: "asc" }],
  });

  const absences: AbsenceDTO[] = rows.map((a) => ({
    id: a.id,
    absenceDate: toIsoDateUTC(a.absenceDate),
    type: a.type === "SICK" ? "SICK" : "VACATION",
    dayPortion: a.dayPortion,
    compensation: a.compensation,
    user: {
      id: a.user.id,
      fullName: a.user.fullName,
    },
  }));

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
      items: items
        .slice()
        .sort((x, y) => x.user.fullName.localeCompare(y.user.fullName)),
    }));

  const byUser = new Map<
    string,
    {
      user: { id: string; fullName: string };
      sickDays: number;
      vacationDays: number;
      unpaidVacationDays: number;
    }
  >();

  for (const a of absences) {
    const cur = byUser.get(a.user.id) ?? {
      user: { id: a.user.id, fullName: a.user.fullName },
      sickDays: 0,
      vacationDays: 0,
      unpaidVacationDays: 0,
    };

    const value = a.dayPortion === "HALF_DAY" ? 0.5 : 1;

    if (a.type === "SICK") {
      cur.sickDays += value;
    } else if (a.compensation === "UNPAID") {
      cur.unpaidVacationDays += value;
    } else {
      cur.vacationDays += value;
    }

    byUser.set(a.user.id, cur);
  }

  const summaryByUser: AbsenceUserSummary[] = Array.from(byUser.values())
    .map((u) => ({
      user: u.user,
      sickDays: u.sickDays,
      vacationDays: u.vacationDays,
      unpaidVacationDays: u.unpaidVacationDays,
      totalDays: u.sickDays + u.vacationDays + u.unpaidVacationDays,
    }))
    .sort((a, b) => a.user.fullName.localeCompare(b.user.fullName));

  return okJson({
    absences,
    groupsByDay,
    summaryByUser,
    ...(rangeInfo ? { range: rangeInfo } : {}),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return okJson({ error: "Nicht eingeloggt" }, { status: 401 });

  const raw = (await req.json().catch(() => null)) as unknown;
  const body: AbsenceBody = isRecord(raw) ? raw : {};

  const startDate = getString(body.startDate);
  const endDate = getString(body.endDate);
  const typeStr = getString(body.type);
  const dayPortionStr = getString(body.dayPortion);
  const compensationStr = getString(body.compensation);
  const userIdFromBody = getString(body.userId);

  if (
    !startDate ||
    !endDate ||
    !typeStr ||
    !isYYYYMMDD(startDate) ||
    !isYYYYMMDD(endDate) ||
    !isAbsenceType(typeStr)
  ) {
    return okJson({ error: "Ungültige Daten" }, { status: 400 });
  }

  const dayPortion: AbsenceDayPortion = isAbsenceDayPortion(dayPortionStr)
    ? dayPortionStr
    : AbsenceDayPortion.FULL_DAY;
  const compensation: AbsenceCompensation = isAbsenceCompensation(compensationStr)
    ? compensationStr
    : AbsenceCompensation.PAID;

  if (typeStr === "SICK" && dayPortion !== AbsenceDayPortion.FULL_DAY) {
    return okJson(
      { error: "Krankheit kann nur ganztägig erfasst werden." },
      { status: 400 }
    );
  }

  if (typeStr === "SICK" && compensation !== AbsenceCompensation.PAID) {
    return okJson(
      { error: "Krankheit darf nicht als unbezahlt erfasst werden." },
      { status: 400 }
    );
  }

  if (
    dayPortion === AbsenceDayPortion.HALF_DAY &&
    typeStr !== "VACATION"
  ) {
    return okJson(
      { error: "Halbe Tage sind nur für Urlaub erlaubt." },
      { status: 400 }
    );
  }

  if (
    dayPortion === AbsenceDayPortion.HALF_DAY &&
    startDate !== endDate
  ) {
    return okJson(
      { error: "Ein halber Urlaubstag darf nur für genau ein Datum angelegt werden." },
      { status: 400 }
    );
  }

  const start = dateOnlyUTC(startDate);
  const end = dateOnlyUTC(endDate);
  if (end < start) {
    return okJson(
      { error: "Enddatum darf nicht vor Startdatum liegen." },
      { status: 400 }
    );
  }

  const isAdmin = session.role === Role.ADMIN;
  const targetUserId = isAdmin && userIdFromBody ? userIdFromBody : session.userId;

  if (!isAdmin) {
    return okJson(
      {
        error:
          "Mitarbeiter dürfen keine finalen Abwesenheiten direkt anlegen. Bitte Antrag stellen.",
      },
      { status: 403 }
    );
  }

  const days = eachDayInclusive(start, end);

  const result = await prisma.absence.createMany({
    data: days.map((d) => ({
      userId: targetUserId,
      absenceDate: d,
      type: typeStr,
      dayPortion,
      compensation,
    })),
    skipDuplicates: true,
  });

  return okJson({
    ok: true,
    requestedDays: days.length,
    created: result.count,
    skipped: days.length - result.count,
    userId: targetUserId,
    dayPortion,
    compensation,
  });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return okJson({ error: "Nicht eingeloggt" }, { status: 401 });

  const raw = (await req.json().catch(() => null)) as unknown;
  const body: AbsencePatchBody = isRecord(raw) ? raw : {};

  const fromStr = getString(body.from);
  const toStr = getString(body.to);
  const typeStr = getString(body.type);
  const dayPortionStr = getString(body.dayPortion);
  const compensationStr = getString(body.compensation);

  const newStartStr = getString(body.newStartDate) || fromStr;
  const newEndStr = getString(body.newEndDate) || toStr;
  const newTypeStr = getString(body.newType) || typeStr;
  const newDayPortionStr = getString(body.newDayPortion) || dayPortionStr;
  const newCompensationStr = getString(body.newCompensation) || compensationStr;

  const userIdFromBody = getString(body.userId);

  if (
    !fromStr ||
    !toStr ||
    !typeStr ||
    !isYYYYMMDD(fromStr) ||
    !isYYYYMMDD(toStr) ||
    !isAbsenceType(typeStr) ||
    !isYYYYMMDD(newStartStr) ||
    !isYYYYMMDD(newEndStr) ||
    !isAbsenceType(newTypeStr)
  ) {
    return okJson({ error: "Ungültige Daten" }, { status: 400 });
  }

  const oldDayPortion: AbsenceDayPortion = isAbsenceDayPortion(dayPortionStr)
    ? dayPortionStr
    : AbsenceDayPortion.FULL_DAY;

  const newDayPortion: AbsenceDayPortion = isAbsenceDayPortion(newDayPortionStr)
    ? newDayPortionStr
    : AbsenceDayPortion.FULL_DAY;

  const oldCompensation: AbsenceCompensation = isAbsenceCompensation(compensationStr)
    ? compensationStr
    : AbsenceCompensation.PAID;

  const newCompensation: AbsenceCompensation = isAbsenceCompensation(newCompensationStr)
    ? newCompensationStr
    : AbsenceCompensation.PAID;

  if (newTypeStr === "SICK" && newDayPortion !== AbsenceDayPortion.FULL_DAY) {
    return okJson(
      { error: "Krankheit kann nur ganztägig sein." },
      { status: 400 }
    );
  }

  if (newTypeStr === "SICK" && newCompensation !== AbsenceCompensation.PAID) {
    return okJson(
      { error: "Krankheit darf nicht unbezahlt sein." },
      { status: 400 }
    );
  }

  if (
    newDayPortion === AbsenceDayPortion.HALF_DAY &&
    newTypeStr !== "VACATION"
  ) {
    return okJson(
      { error: "Halbe Tage sind nur für Urlaub erlaubt." },
      { status: 400 }
    );
  }

  if (
    newDayPortion === AbsenceDayPortion.HALF_DAY &&
    newStartStr !== newEndStr
  ) {
    return okJson(
      { error: "Ein halber Urlaubstag darf nur für genau ein Datum bestehen." },
      { status: 400 }
    );
  }

  const from = dateOnlyUTC(fromStr);
  const to = dateOnlyUTC(toStr);
  if (to < from) {
    return okJson({ error: "to darf nicht vor from liegen" }, { status: 400 });
  }

  const newStart = dateOnlyUTC(newStartStr);
  const newEnd = dateOnlyUTC(newEndStr);
  if (newEnd < newStart) {
    return okJson(
      { error: "newEndDate darf nicht vor newStartDate liegen" },
      { status: 400 }
    );
  }

  const isAdmin = session.role === Role.ADMIN;
  const targetUserId = isAdmin && userIdFromBody ? userIdFromBody : session.userId;
  if (!isAdmin) {
    return okJson(
      { error: "Mitarbeiter dürfen finale Abwesenheiten nicht direkt bearbeiten." },
      { status: 403 }
    );
  }

  const deleteFrom = from;
  const deleteToExclusive = new Date(to);
  deleteToExclusive.setUTCDate(deleteToExclusive.getUTCDate() + 1);

  const createDays = eachDayInclusive(newStart, newEnd);

  const tx = await prisma.$transaction(async (p) => {
    const del = await p.absence.deleteMany({
      where: {
        userId: targetUserId,
        type: typeStr,
        dayPortion: oldDayPortion,
        compensation: oldCompensation,
        absenceDate: { gte: deleteFrom, lt: deleteToExclusive },
      },
    });

    const created = await p.absence.createMany({
      data: createDays.map((d) => ({
        userId: targetUserId,
        absenceDate: d,
        type: newTypeStr,
        dayPortion: newDayPortion,
        compensation: newCompensation,
      })),
      skipDuplicates: true,
    });

    return {
      deleted: del.count,
      created: created.count,
      requested: createDays.length,
    };
  });

  return okJson({
    ok: true,
    userId: targetUserId,
    old: {
      from: fromStr,
      to: toStr,
      type: typeStr,
      dayPortion: oldDayPortion,
      compensation: oldCompensation,
    },
    next: {
      from: newStartStr,
      to: newEndStr,
      type: newTypeStr,
      dayPortion: newDayPortion,
      compensation: newCompensation,
    },
    deleted: tx.deleted,
    created: tx.created,
    requested: tx.requested,
    skipped: tx.requested - tx.created,
  });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return okJson({ error: "Nicht eingeloggt" }, { status: 401 });

  const url = new URL(req.url);
  const id = (url.searchParams.get("id") ?? "").trim();

  if (id) {
    const a = await prisma.absence.findUnique({ where: { id } });
    if (!a) return okJson({ error: "Nicht gefunden" }, { status: 404 });

    const isAdmin = session.role === Role.ADMIN;
    if (!isAdmin) {
      return okJson(
        { error: "Mitarbeiter dürfen finale Abwesenheiten nicht direkt löschen." },
        { status: 403 }
      );
    }

    await prisma.absence.delete({ where: { id } });
    return okJson({ ok: true, deleted: 1 });
  }

  const fromStr = (url.searchParams.get("from") ?? "").trim();
  const toStr = (url.searchParams.get("to") ?? "").trim();
  const typeStr = (url.searchParams.get("type") ?? "").trim();
  const dayPortionStr = (url.searchParams.get("dayPortion") ?? "").trim();
  const compensationStr = (url.searchParams.get("compensation") ?? "").trim();

  if (
    !fromStr ||
    !toStr ||
    !typeStr ||
    !isYYYYMMDD(fromStr) ||
    !isYYYYMMDD(toStr) ||
    !isAbsenceType(typeStr)
  ) {
    return okJson(
      { error: "id oder (from,to,type) erforderlich" },
      { status: 400 }
    );
  }

  const dayPortion: AbsenceDayPortion = isAbsenceDayPortion(dayPortionStr)
    ? dayPortionStr
    : AbsenceDayPortion.FULL_DAY;

  const compensation: AbsenceCompensation = isAbsenceCompensation(compensationStr)
    ? compensationStr
    : AbsenceCompensation.PAID;

  const from = dateOnlyUTC(fromStr);
  const to = dateOnlyUTC(toStr);
  if (to < from) {
    return okJson({ error: "to darf nicht vor from liegen" }, { status: 400 });
  }

  const isAdmin = session.role === Role.ADMIN;
  if (!isAdmin) {
    return okJson(
      { error: "Mitarbeiter dürfen finale Abwesenheiten nicht direkt löschen." },
      { status: 403 }
    );
  }

  const targetUserId =
    (url.searchParams.get("userId") ?? "").trim() || session.userId;

  const toExclusive = new Date(to);
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);

  const del = await prisma.absence.deleteMany({
    where: {
      userId: targetUserId,
      type: typeStr,
      dayPortion,
      compensation,
      absenceDate: { gte: from, lt: toExclusive },
    },
  });

  return okJson({
    ok: true,
    deleted: del.count,
    range: {
      from: fromStr,
      to: toStr,
      type: typeStr,
      dayPortion,
      compensation,
    },
  });
}