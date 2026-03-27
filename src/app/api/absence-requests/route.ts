import { NextResponse } from "next/server";
import {
  AbsenceCompensation,
  AbsenceDayPortion,
  AbsenceRequestStatus,
  AbsenceType,
} from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildPushUrl, sendPushToAdmins } from "@/lib/webpush";

type CreateAbsenceRequestBody = {
  startDate?: unknown;
  endDate?: unknown;
  type?: unknown;
  dayPortion?: unknown;
  noteEmployee?: unknown;
  compensation?: unknown;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function isYYYYMM(v: string): boolean {
  return /^\d{4}-\d{2}$/.test(v);
}

function isYYYYMMDD(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
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

function dateOnlyUTC(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

function toIsoDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isUtcWeekday(date: Date): boolean {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
}

function countVacationRequestDaysExcludingWeekends(
  startDate: Date,
  endDate: Date,
  dayPortion: AbsenceDayPortion
): number {
  if (dayPortion === AbsenceDayPortion.HALF_DAY) {
    return 0.5;
  }

  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    if (isUtcWeekday(current)) {
      count += 1;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return count;
}

function buildEffectiveAbsenceDays(
  startDate: Date,
  endDate: Date,
  type: AbsenceType,
  dayPortion: AbsenceDayPortion
): Date[] {
  if (dayPortion === AbsenceDayPortion.HALF_DAY) {
    return [new Date(startDate)];
  }

  const out: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const copy = new Date(current);

    if (type === AbsenceType.VACATION) {
      if (isUtcWeekday(copy)) {
        out.push(copy);
      }
    } else {
      out.push(copy);
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return out;
}

const ANNUAL_VACATION_DAYS = 30;
const MONTHLY_VACATION_ACCRUAL_DAYS = ANNUAL_VACATION_DAYS / 12;

type VacationRequestBalanceRow = {
  id: string;
  startDate: Date;
  endDate: Date;
  dayPortion: AbsenceDayPortion;
  compensation: AbsenceCompensation;
  paidVacationUnits: number;
  unpaidVacationUnits: number;
  autoUnpaidBecauseNoBalance: boolean;
  compensationLockedBySystem: boolean;
  createdAt: Date;
};

type VacationAbsenceBalanceRow = {
  absenceDate: Date;
  dayPortion: AbsenceDayPortion;
};

function startOfUtcYear(year: number): Date {
  return new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
}

function startOfNextUtcYear(year: number): Date {
  return new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
}

function getAccruedVacationDaysUntilDate(date: Date): number {
  const monthOneBased = date.getUTCMonth() + 1;
  return Math.min(ANNUAL_VACATION_DAYS, monthOneBased * MONTHLY_VACATION_ACCRUAL_DAYS);
}

function getRequestVacationUnits(
  startDate: Date,
  endDate: Date,
  dayPortion: AbsenceDayPortion
): number {
  const days = countVacationRequestDaysExcludingWeekends(
    startDate,
    endDate,
    dayPortion
  );

  return Math.round(days * 2);
}
function getStoredPaidVacationUnits(request: VacationRequestBalanceRow): number {
  if (request.paidVacationUnits > 0 || request.unpaidVacationUnits > 0) {
    return request.paidVacationUnits;
  }

  const totalUnits = getRequestVacationUnits(
    request.startDate,
    request.endDate,
    request.dayPortion
  );

  return request.compensation === AbsenceCompensation.PAID ? totalUnits : 0;
}

function getStoredUnpaidVacationUnits(request: VacationRequestBalanceRow): number {
  if (request.paidVacationUnits > 0 || request.unpaidVacationUnits > 0) {
    return request.unpaidVacationUnits;
  }

  const totalUnits = getRequestVacationUnits(
    request.startDate,
    request.endDate,
    request.dayPortion
  );

  return request.compensation === AbsenceCompensation.UNPAID ? totalUnits : 0;
}

function getAbsenceDayValue(dayPortion: AbsenceDayPortion): number {
  return dayPortion === AbsenceDayPortion.HALF_DAY ? 0.5 : 1;
}

function getAbsenceDayUnits(dayPortion: AbsenceDayPortion): number {
  return dayPortion === AbsenceDayPortion.HALF_DAY ? 1 : 2;
}

function sumApprovedPaidVacationUnitsUntil(
  rows: VacationAbsenceBalanceRow[],
  limitDate: Date
): number {
  return rows.reduce((sum, row) => {
    if (row.absenceDate > limitDate) return sum;
    return sum + getAbsenceDayUnits(row.dayPortion);
  }, 0);
}

function sumReservedPendingPaidVacationUnitsUntil(
  rows: Array<{ endDate: Date; units: number }>,
  limitDate: Date
): number {
  return rows.reduce((sum, row) => {
    if (row.endDate > limitDate) return sum;
    return sum + row.units;
  }, 0);
}

async function rebalanceAutoUnpaidVacationRequestsForYear(
  userId: string,
  year: number
): Promise<void> {
  const yearStart = startOfUtcYear(year);
  const nextYearStart = startOfNextUtcYear(year);

  const approvedPaidVacationAbsences = await prisma.absence.findMany({
    where: {
      userId,
      type: AbsenceType.VACATION,
      compensation: AbsenceCompensation.PAID,
      absenceDate: {
        gte: yearStart,
        lt: nextYearStart,
      },
    },
    select: {
      absenceDate: true,
      dayPortion: true,
    },
    orderBy: {
      absenceDate: "asc",
    },
  });

  const pendingVacationRequests = await prisma.absenceRequest.findMany({
    where: {
      userId,
      type: AbsenceType.VACATION,
      status: AbsenceRequestStatus.PENDING,
      startDate: {
        lt: nextYearStart,
      },
      endDate: {
        gte: yearStart,
      },
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      dayPortion: true,
      compensation: true,
      paidVacationUnits: true,
      unpaidVacationUnits: true,
      autoUnpaidBecauseNoBalance: true,
      compensationLockedBySystem: true,
      createdAt: true,
    },
    orderBy: [
      { endDate: "asc" },
      { startDate: "asc" },
      { createdAt: "asc" },
    ],
  });

  const reservedPendingPaid: Array<{ endDate: Date; units: number }> = [];
  const updates: Array<Promise<unknown>> = [];

  for (const request of pendingVacationRequests) {
    const requestedUnits = getRequestVacationUnits(
      request.startDate,
      request.endDate,
      request.dayPortion
    );

    const accruedUnits = Math.round(getAccruedVacationDaysUntilDate(request.endDate) * 2);
    const approvedPaidUnits = sumApprovedPaidVacationUnitsUntil(
      approvedPaidVacationAbsences,
      request.endDate
    );
    const reservedPendingUnits = sumReservedPendingPaidVacationUnitsUntil(
      reservedPendingPaid,
      request.endDate
    );

    const availableUnits = Math.max(
      0,
      accruedUnits - approvedPaidUnits - reservedPendingUnits
    );

    const isManualUnpaid =
      request.compensation === AbsenceCompensation.UNPAID &&
      !request.autoUnpaidBecauseNoBalance;

    if (isManualUnpaid) {
      continue;
    }

    const currentPaidUnits = getStoredPaidVacationUnits(request);

    if (currentPaidUnits > 0) {
      reservedPendingPaid.push({
        endDate: request.endDate,
        units: currentPaidUnits,
      });
      continue;
    }

    if (!request.autoUnpaidBecauseNoBalance) {
      continue;
    }

    const nextPaidUnits = Math.min(availableUnits, requestedUnits);
    const nextUnpaidUnits = Math.max(0, requestedUnits - nextPaidUnits);

    updates.push(
      prisma.absenceRequest.update({
        where: { id: request.id },
        data: {
          compensation:
            nextPaidUnits > 0
              ? AbsenceCompensation.PAID
              : AbsenceCompensation.UNPAID,
          paidVacationUnits: nextPaidUnits,
          unpaidVacationUnits: nextUnpaidUnits,
          autoUnpaidBecauseNoBalance: nextUnpaidUnits > 0,
          compensationLockedBySystem: nextUnpaidUnits > 0,
        },
      })
    );

    if (nextPaidUnits > 0) {
      reservedPendingPaid.push({
        endDate: request.endDate,
        units: nextPaidUnits,
      });
    }
  }

  if (updates.length > 0) {
    await Promise.all(updates);
  }
}

async function getVacationRequestDecisionForNewRequest(
  userId: string,
  startDate: Date,
  endDate: Date,
  dayPortion: AbsenceDayPortion
): Promise<{
  compensation: AbsenceCompensation;
  autoUnpaidBecauseNoBalance: boolean;
  compensationLockedBySystem: boolean;
  paidVacationUnits: number;
  unpaidVacationUnits: number;
}> {
  const year = endDate.getUTCFullYear();
  const yearStart = startOfUtcYear(year);
  const nextYearStart = startOfNextUtcYear(year);

  const approvedPaidVacationAbsences = await prisma.absence.findMany({
    where: {
      userId,
      type: AbsenceType.VACATION,
      compensation: AbsenceCompensation.PAID,
      absenceDate: {
        gte: yearStart,
        lt: nextYearStart,
      },
    },
    select: {
      absenceDate: true,
      dayPortion: true,
    },
  });

  const pendingVacationRequests = await prisma.absenceRequest.findMany({
    where: {
      userId,
      type: AbsenceType.VACATION,
      status: AbsenceRequestStatus.PENDING,
      startDate: {
        lt: nextYearStart,
      },
      endDate: {
        gte: yearStart,
      },
    },
    select: {
      endDate: true,
      paidVacationUnits: true,
    },
  });

  const reservedPendingPaid = pendingVacationRequests.map((request) => ({
    endDate: request.endDate,
    units: request.paidVacationUnits,
  }));

  const accruedUnits = Math.round(getAccruedVacationDaysUntilDate(endDate) * 2);
  const approvedPaidUnits = sumApprovedPaidVacationUnitsUntil(
    approvedPaidVacationAbsences,
    endDate
  );
  const reservedPendingUnits = sumReservedPendingPaidVacationUnitsUntil(
    reservedPendingPaid,
    endDate
  );
  const requestedUnits = getRequestVacationUnits(startDate, endDate, dayPortion);

  const availableUnits = Math.max(
    0,
    accruedUnits - approvedPaidUnits - reservedPendingUnits
  );

  const paidVacationUnits = Math.min(availableUnits, requestedUnits);
  const unpaidVacationUnits = Math.max(0, requestedUnits - paidVacationUnits);

  return {
    compensation:
      paidVacationUnits > 0
        ? AbsenceCompensation.PAID
        : AbsenceCompensation.UNPAID,
    autoUnpaidBecauseNoBalance: unpaidVacationUnits > 0,
    compensationLockedBySystem: unpaidVacationUnits > 0,
    paidVacationUnits,
    unpaidVacationUnits,
  };
}

async function getRemainingPaidVacationDaysForMonth(
  userId: string,
  year: number,
  month: number
): Promise<number> {
  const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  const yearStart = startOfUtcYear(year);
  const nextYearStart = startOfNextUtcYear(year);

  await rebalanceAutoUnpaidVacationRequestsForYear(userId, year);

  const approvedPaidVacationAbsences = await prisma.absence.findMany({
    where: {
      userId,
      type: AbsenceType.VACATION,
      compensation: AbsenceCompensation.PAID,
      absenceDate: {
        gte: yearStart,
        lt: nextYearStart,
      },
    },
    select: {
      absenceDate: true,
      dayPortion: true,
    },
  });

  const pendingVacationRequests = await prisma.absenceRequest.findMany({
    where: {
      userId,
      type: AbsenceType.VACATION,
      status: AbsenceRequestStatus.PENDING,
      endDate: {
        lte: monthEnd,
      },
      startDate: {
        lt: nextYearStart,
      },
    },
    select: {
      endDate: true,
      paidVacationUnits: true,
    },
  });

  const accruedUnits = Math.round(
    Math.min(ANNUAL_VACATION_DAYS, month * MONTHLY_VACATION_ACCRUAL_DAYS) * 2
  );

  const approvedPaidUnits = sumApprovedPaidVacationUnitsUntil(
    approvedPaidVacationAbsences,
    monthEnd
  );

  const reservedPendingUnits = pendingVacationRequests.reduce((sum, request) => {
    return sum + request.paidVacationUnits;
  }, 0);

  return Math.max(0, (accruedUnits - approvedPaidUnits - reservedPendingUnits) / 2);
}

function mapRequest(r: {
  id: string;
  startDate: Date;
  endDate: Date;
  type: AbsenceType;
  dayPortion: AbsenceDayPortion;
  status: AbsenceRequestStatus;
  compensation: AbsenceCompensation;
  paidVacationUnits: number;
  unpaidVacationUnits: number;
  autoUnpaidBecauseNoBalance: boolean;
  compensationLockedBySystem: boolean;
  noteEmployee: string | null;
  createdAt: Date;
  updatedAt: Date;
  decidedAt: Date | null;
  user: {
    id: string;
    fullName: string;
  };
  decidedBy: {
    id: string;
    fullName: string;
  } | null;
}) {
  return {
    id: r.id,
    startDate: toIsoDateUTC(r.startDate),
    endDate: toIsoDateUTC(r.endDate),
    type: r.type,
    dayPortion: r.dayPortion,
    status: r.status,
    compensation: r.compensation,
    paidVacationUnits: r.paidVacationUnits,
    unpaidVacationUnits: r.unpaidVacationUnits,
    autoUnpaidBecauseNoBalance: r.autoUnpaidBecauseNoBalance,
    compensationLockedBySystem: r.compensationLockedBySystem,
    noteEmployee: r.noteEmployee ?? "",
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    decidedAt: r.decidedAt ? r.decidedAt.toISOString() : null,
    user: {
      id: r.user.id,
      fullName: r.user.fullName,
    },
    decidedBy: r.decidedBy
      ? {
          id: r.decidedBy.id,
          fullName: r.decidedBy.fullName,
        }
      : null,
  };
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Nicht eingeloggt." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const monthParam = (searchParams.get("month") ?? "").trim();

  const where: {
    userId: string;
    startDate?: { lt: Date };
    endDate?: { gte: Date };
  } = {
    userId: session.userId,
  };

  if (monthParam) {
    if (!isYYYYMM(monthParam)) {
      return NextResponse.json(
        { ok: false, error: "month muss YYYY-MM sein." },
        { status: 400 }
      );
    }

    const year = Number(monthParam.slice(0, 4));
    const month = Number(monthParam.slice(5, 7));

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const nextMonthStart = new Date(Date.UTC(year, month, 1));

    where.startDate = { lt: nextMonthStart };
    where.endDate = { gte: monthStart };
  }

  const balanceYear = monthParam
    ? Number(monthParam.slice(0, 4))
    : new Date().getUTCFullYear();

  const balanceMonth = monthParam
    ? Number(monthParam.slice(5, 7))
    : new Date().getUTCMonth() + 1;

  await rebalanceAutoUnpaidVacationRequestsForYear(session.userId, balanceYear);

  const remainingPaidVacationDaysForMonth = await getRemainingPaidVacationDaysForMonth(
    session.userId,
    balanceYear,
    balanceMonth
  );

  const requests = await prisma.absenceRequest.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
      decidedBy: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    ok: true,
    requests: requests.map(mapRequest),
    vacationRequestBalance: {
      remainingPaidVacationDaysForMonth,
    },
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Nicht eingeloggt." },
      { status: 401 }
    );
  }

  const raw = (await req.json().catch(() => null)) as unknown;
  const body: CreateAbsenceRequestBody = isRecord(raw)
    ? raw
    : {};

  const startDate = getString(body.startDate).trim();
  const endDate = getString(body.endDate).trim();
  const typeRaw = getString(body.type).trim();
  const dayPortionRaw = getString(body.dayPortion).trim();
  const noteEmployee = getString(body.noteEmployee).trim();
  const compensationRaw = getString(body.compensation).trim();

  if (!isYYYYMMDD(startDate) || !isYYYYMMDD(endDate)) {
    return NextResponse.json(
      { ok: false, error: "Start- und Enddatum müssen YYYY-MM-DD sein." },
      { status: 400 }
    );
  }

  if (!isAbsenceType(typeRaw)) {
    return NextResponse.json(
      { ok: false, error: "Ungültiger Abwesenheitstyp." },
      { status: 400 }
    );
  }

  const dayPortion: AbsenceDayPortion =
    isAbsenceDayPortion(dayPortionRaw) ? dayPortionRaw : AbsenceDayPortion.FULL_DAY;

  const requestedCompensation: AbsenceCompensation =
    isAbsenceCompensation(compensationRaw) ? compensationRaw : AbsenceCompensation.PAID;

  let finalCompensation = requestedCompensation;
  let autoUnpaidBecauseNoBalance = false;
  let compensationLockedBySystem = false;
  let paidVacationUnits = 0;
  let unpaidVacationUnits = 0;

  const start = dateOnlyUTC(startDate);
  const end = dateOnlyUTC(endDate);

  if (end < start) {
    return NextResponse.json(
      { ok: false, error: "Ende darf nicht vor Start liegen." },
      { status: 400 }
    );
  }

  if (start.getUTCFullYear() !== end.getUTCFullYear()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Jahresübergreifende Urlaubs- oder Krankheitsanträge werden aktuell noch nicht unterstützt. Bitte je Kalenderjahr einen separaten Antrag stellen.",
      },
      { status: 400 }
    );
  }

  if (typeRaw === "SICK" && dayPortion !== AbsenceDayPortion.FULL_DAY) {
    return NextResponse.json(
      { ok: false, error: "Krankheit kann nur ganztägig beantragt werden." },
      { status: 400 }
    );
  }

  if (typeRaw === "SICK" && finalCompensation !== AbsenceCompensation.PAID) {
    return NextResponse.json(
      { ok: false, error: "Krankheit darf nicht als unbezahlt beantragt werden." },
      { status: 400 }
    );
  }

  if (
    dayPortion === AbsenceDayPortion.HALF_DAY &&
    typeRaw !== "VACATION"
  ) {
    return NextResponse.json(
      { ok: false, error: "Halbe Tage sind nur für Urlaub erlaubt." },
      { status: 400 }
    );
  }

  if (
    dayPortion === AbsenceDayPortion.HALF_DAY &&
    startDate !== endDate
  ) {
    return NextResponse.json(
      { ok: false, error: "Ein halber Urlaubstag darf nur für genau ein Datum beantragt werden." },
      { status: 400 }
    );
  }

  if (
    typeRaw === "VACATION" &&
    dayPortion === AbsenceDayPortion.FULL_DAY
  ) {
    const effectiveVacationDays = countVacationRequestDaysExcludingWeekends(
      start,
      end,
      dayPortion
    );

    if (effectiveVacationDays <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Im gewählten Zeitraum liegen keine Arbeitstage für Urlaub. Wochenenden werden automatisch nicht mitgezählt.",
        },
        { status: 400 }
      );
    }
  }

  if (typeRaw === "VACATION") {
    const requestedUnits = getRequestVacationUnits(start, end, dayPortion);

    if (requestedCompensation === AbsenceCompensation.PAID) {
      const decision = await getVacationRequestDecisionForNewRequest(
        session.userId,
        start,
        end,
        dayPortion
      );

      finalCompensation = decision.compensation;
      autoUnpaidBecauseNoBalance = decision.autoUnpaidBecauseNoBalance;
      compensationLockedBySystem = decision.compensationLockedBySystem;
      paidVacationUnits = decision.paidVacationUnits;
      unpaidVacationUnits = decision.unpaidVacationUnits;
    } else {
      finalCompensation = AbsenceCompensation.UNPAID;
      autoUnpaidBecauseNoBalance = false;
      compensationLockedBySystem = false;
      paidVacationUnits = 0;
      unpaidVacationUnits = requestedUnits;
    }
  }

  const conflictingApprovedAbsence = await prisma.absence.findFirst({
    where: {
      userId: session.userId,
      absenceDate: {
        gte: start,
        lte: end,
      },
    },
    select: {
      id: true,
    },
  });

  if (conflictingApprovedAbsence) {
    return NextResponse.json(
      {
        ok: false,
        error: "Im gewünschten Zeitraum existiert bereits eine bestätigte Abwesenheit.",
      },
      { status: 409 }
    );
  }

  const conflictingPendingRequest = await prisma.absenceRequest.findFirst({
    where: {
      userId: session.userId,
      status: AbsenceRequestStatus.PENDING,
      startDate: {
        lte: end,
      },
      endDate: {
        gte: start,
      },
    },
    select: {
      id: true,
    },
  });

  if (conflictingPendingRequest) {
    return NextResponse.json(
      {
        ok: false,
        error: "Für diesen Zeitraum existiert bereits ein offener Antrag.",
      },
      { status: 409 }
    );
  }

  const created = await prisma.absenceRequest.create({
    data: {
      userId: session.userId,
      startDate: start,
      endDate: end,
      type: typeRaw,
      dayPortion,
      status: AbsenceRequestStatus.PENDING,
      compensation: finalCompensation,
      paidVacationUnits,
      unpaidVacationUnits,
      autoUnpaidBecauseNoBalance,
      compensationLockedBySystem,
      noteEmployee: noteEmployee || null,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
      decidedBy: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  const typeLabel = typeRaw === "VACATION" ? "Urlaub" : "Krankheit";
  const compensationLabel =
    typeRaw === "VACATION"
      ? finalCompensation === AbsenceCompensation.UNPAID
        ? "unbezahlt"
        : "bezahlt"
      : "";

  const dateLabel =
    dayPortion === AbsenceDayPortion.HALF_DAY
      ? `halber Urlaubstag am ${startDate}`
      : startDate === endDate
        ? startDate
        : `${startDate} bis ${endDate}`;

  const adminTargetUrl =
    typeRaw === "VACATION"
      ? buildPushUrl("/admin/urlaubsantraege")
      : buildPushUrl("/admin/krankheitsantraege");

  await sendPushToAdmins({
    companyId: session.companyId,
    title: "Neuer Abwesenheitsantrag",
    body: `${session.fullName} hat ${typeLabel.toLowerCase()} beantragt (${dateLabel}${typeRaw === "VACATION" ? `, ${compensationLabel}` : ""}).`,
    url: adminTargetUrl,
  });

  return NextResponse.json({
    ok: true,
    request: mapRequest(created),
  });
}