import { NextResponse } from "next/server";
import {
  AbsenceCompensation,
  AbsenceDayPortion,
  AbsenceRequestStatus,
  AbsenceType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { buildPushUrl, sendPushToUser } from "@/lib/webpush";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ApproveAbsenceRequestBody = {
  startDate?: unknown;
  endDate?: unknown;
  type?: unknown;
  dayPortion?: unknown;
  compensation?: unknown;
};

function toIsoDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function isYYYYMMDD(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function dateOnlyUTC(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
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

function eachDayInclusive(from: Date, to: Date): Date[] {
  const out: Date[] = [];
  const cur = new Date(from);

  while (cur <= to) {
    out.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  return out;
}

function isUtcWeekday(date: Date): boolean {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
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

function startOfUtcYear(year: number): Date {
  return new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
}

function startOfNextUtcYear(year: number): Date {
  return new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
}

function getAccruedVacationDaysForYearAtEffectiveDate(
  year: number,
  effectiveDate: Date
): number {
  const effectiveYear = effectiveDate.getUTCFullYear();

  if (effectiveYear < year) {
    return 0;
  }

  if (effectiveYear > year) {
    return ANNUAL_VACATION_DAYS;
  }

  const monthOneBased = effectiveDate.getUTCMonth() + 1;

  return Math.min(
    ANNUAL_VACATION_DAYS,
    monthOneBased * MONTHLY_VACATION_ACCRUAL_DAYS
  );
}

function getVacationDaysForRange(
  startDate: Date,
  endDate: Date,
  dayPortion: AbsenceDayPortion
): number {
  if (dayPortion === AbsenceDayPortion.HALF_DAY) {
    return 0.5;
  }

  return buildEffectiveAbsenceDays(
    startDate,
    endDate,
    AbsenceType.VACATION,
    dayPortion
  ).length;
}

function getDayPortionValue(dayPortion: AbsenceDayPortion): number {
  return dayPortion === AbsenceDayPortion.HALF_DAY ? 0.5 : 1;
}

function getDayPortionUnits(dayPortion: AbsenceDayPortion): number {
  return dayPortion === AbsenceDayPortion.HALF_DAY ? 1 : 2;
}

function portionLabel(
  type: AbsenceType,
  dayPortion: AbsenceDayPortion,
  startDate: string,
  endDate: string
): string {
  if (type === "VACATION" && dayPortion === "HALF_DAY") {
    return `halber Urlaubstag am ${startDate}`;
  }
  if (startDate === endDate) return startDate;
  return `${startDate} bis ${endDate}`;
}

function buildVacationAbsenceRowsWithSplit(
  userId: string,
  days: Date[],
  paidUnits: number,
  unpaidUnits: number
): Array<{
  userId: string;
  absenceDate: Date;
  type: AbsenceType;
  dayPortion: AbsenceDayPortion;
  compensation: AbsenceCompensation;
}> {
  const rows: Array<{
    userId: string;
    absenceDate: Date;
    type: AbsenceType;
    dayPortion: AbsenceDayPortion;
    compensation: AbsenceCompensation;
  }> = [];

  let remainingPaidUnits = paidUnits;
  let remainingUnpaidUnits = unpaidUnits;

  for (const day of days) {
    if (remainingPaidUnits >= 2) {
      rows.push({
        userId,
        absenceDate: day,
        type: AbsenceType.VACATION,
        dayPortion: AbsenceDayPortion.FULL_DAY,
        compensation: AbsenceCompensation.PAID,
      });
      remainingPaidUnits -= 2;
      continue;
    }

    if (remainingPaidUnits === 1 && remainingUnpaidUnits >= 1) {
      rows.push({
        userId,
        absenceDate: day,
        type: AbsenceType.VACATION,
        dayPortion: AbsenceDayPortion.HALF_DAY,
        compensation: AbsenceCompensation.PAID,
      });
      rows.push({
        userId,
        absenceDate: day,
        type: AbsenceType.VACATION,
        dayPortion: AbsenceDayPortion.HALF_DAY,
        compensation: AbsenceCompensation.UNPAID,
      });
      remainingPaidUnits -= 1;
      remainingUnpaidUnits -= 1;
      continue;
    }

    if (remainingUnpaidUnits >= 2) {
      rows.push({
        userId,
        absenceDate: day,
        type: AbsenceType.VACATION,
        dayPortion: AbsenceDayPortion.FULL_DAY,
        compensation: AbsenceCompensation.UNPAID,
      });
      remainingUnpaidUnits -= 2;
      continue;
    }

    if (remainingUnpaidUnits === 1) {
      rows.push({
        userId,
        absenceDate: day,
        type: AbsenceType.VACATION,
        dayPortion: AbsenceDayPortion.HALF_DAY,
        compensation: AbsenceCompensation.UNPAID,
      });
      remainingUnpaidUnits -= 1;
    }
  }

  return rows;
}

export async function POST(req: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const params = await context.params;
  const requestId = params.id.trim();

  if (!requestId) {
    return NextResponse.json(
      { ok: false, error: "Fehlende Request-ID." },
      { status: 400 }
    );
  }

  const raw = (await req.json().catch(() => null)) as unknown;
  const body: ApproveAbsenceRequestBody = isRecord(raw) ? raw : {};

  const existing = await prisma.absenceRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          isActive: true,
          companyId: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "Antrag nicht gefunden." },
      { status: 404 }
    );
  }

  if (existing.user.companyId !== admin.companyId) {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  if (!existing.user.isActive) {
    return NextResponse.json(
      { ok: false, error: "Mitarbeiter ist nicht aktiv." },
      { status: 409 }
    );
  }

  if (existing.status !== AbsenceRequestStatus.PENDING) {
    return NextResponse.json(
      { ok: false, error: "Nur offene Anträge können genehmigt werden." },
      { status: 409 }
    );
  }

  const startDateRaw = getString(body.startDate).trim();
  const endDateRaw = getString(body.endDate).trim();
  const typeRaw = getString(body.type).trim();
  const dayPortionRaw = getString(body.dayPortion).trim();
  const compensationRaw = getString(body.compensation).trim();

  const finalType: AbsenceType = isAbsenceType(typeRaw)
    ? typeRaw
    : existing.type;

  const finalStartDate: Date =
    isYYYYMMDD(startDateRaw) ? dateOnlyUTC(startDateRaw) : existing.startDate;

  const finalEndDate: Date =
    isYYYYMMDD(endDateRaw) ? dateOnlyUTC(endDateRaw) : existing.endDate;

  let finalDayPortion: AbsenceDayPortion = isAbsenceDayPortion(dayPortionRaw)
    ? dayPortionRaw
    : existing.dayPortion;

  let finalCompensation: AbsenceCompensation = isAbsenceCompensation(compensationRaw)
    ? compensationRaw
    : existing.compensation;
  let finalPaidVacationUnits = existing.paidVacationUnits;
  let finalUnpaidVacationUnits = existing.unpaidVacationUnits;

  if (finalType === AbsenceType.SICK) {
    finalDayPortion = AbsenceDayPortion.FULL_DAY;
    finalCompensation = AbsenceCompensation.PAID;
  }

  if (finalEndDate < finalStartDate) {
    return NextResponse.json(
      { ok: false, error: "Ende darf nicht vor Start liegen." },
      { status: 400 }
    );
  }

  if (finalStartDate.getUTCFullYear() !== finalEndDate.getUTCFullYear()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Jahresübergreifende Abwesenheiten werden aktuell noch nicht unterstützt. Bitte je Kalenderjahr separat genehmigen.",
      },
      { status: 400 }
    );
  }

  if (
    finalType !== AbsenceType.VACATION &&
    finalDayPortion === AbsenceDayPortion.HALF_DAY
  ) {
    return NextResponse.json(
      { ok: false, error: "Halbe Tage sind nur für Urlaub erlaubt." },
      { status: 400 }
    );
  }

  const conflictingAbsence = await prisma.absence.findFirst({
    where: {
      userId: existing.userId,
      absenceDate: {
        gte: finalStartDate,
        lte: finalEndDate,
      },
    },
    select: {
      id: true,
      absenceDate: true,
      type: true,
      dayPortion: true,
    },
  });

  if (conflictingAbsence) {
    return NextResponse.json(
      {
        ok: false,
        error: "Im Zeitraum existiert bereits eine bestätigte Abwesenheit.",
      },
      { status: 409 }
    );
  }

  const days = buildEffectiveAbsenceDays(
    finalStartDate,
    finalEndDate,
    finalType,
    finalDayPortion
  );

  if (
    finalType === AbsenceType.VACATION &&
    finalDayPortion === AbsenceDayPortion.FULL_DAY &&
    days.length === 0
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Im gewählten Zeitraum liegen keine Arbeitstage für Urlaub. Wochenenden werden automatisch nicht mitgezählt.",
      },
      { status: 400 }
    );
  }

  let nextAutoUnpaidBecauseNoBalance = existing.autoUnpaidBecauseNoBalance;
  let nextCompensationLockedBySystem = existing.compensationLockedBySystem;

  if (finalType === AbsenceType.VACATION) {
    const balanceYear = finalEndDate.getUTCFullYear();
    const yearStart = startOfUtcYear(balanceYear);
    const nextYearStart = startOfNextUtcYear(balanceYear);

    const otherVacationRequests = await prisma.absenceRequest.findMany({
      where: {
        userId: existing.userId,
        type: AbsenceType.VACATION,
        status: {
          in: [AbsenceRequestStatus.PENDING, AbsenceRequestStatus.APPROVED],
        },
        id: {
          not: existing.id,
        },
        startDate: {
          lt: nextYearStart,
        },
        endDate: {
          gte: yearStart,
        },
      },
      select: {
        compensation: true,
        paidVacationUnits: true,
        autoUnpaidBecauseNoBalance: true,
      },
    });

    const requestedUnits =
      finalDayPortion === AbsenceDayPortion.HALF_DAY
        ? 1
        : buildEffectiveAbsenceDays(
            finalStartDate,
            finalEndDate,
            AbsenceType.VACATION,
            finalDayPortion
          ).length * 2;

    const accruedUnits = Math.round(
      getAccruedVacationDaysForYearAtEffectiveDate(balanceYear, new Date()) * 2
    );

    const reservedPaidUnits = otherVacationRequests.reduce((sum, request) => {
      const isManualUnpaid =
        request.compensation === AbsenceCompensation.UNPAID &&
        !request.autoUnpaidBecauseNoBalance;

      if (isManualUnpaid) {
        return sum;
      }

      return sum + request.paidVacationUnits;
    }, 0);

    const availablePaidUnits = Math.max(0, accruedUnits - reservedPaidUnits);

    finalPaidVacationUnits = Math.min(availablePaidUnits, requestedUnits);
    finalUnpaidVacationUnits = Math.max(
      0,
      requestedUnits - finalPaidVacationUnits
    );

    finalCompensation =
      finalPaidVacationUnits > 0
        ? AbsenceCompensation.PAID
        : AbsenceCompensation.UNPAID;

    nextAutoUnpaidBecauseNoBalance = finalUnpaidVacationUnits > 0;
    nextCompensationLockedBySystem = finalUnpaidVacationUnits > 0;
  } else {
    finalPaidVacationUnits = 0;
    finalUnpaidVacationUnits = 0;
  }

  const txResult = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.absenceRequest.update({
      where: { id: existing.id },
      data: {
        startDate: finalStartDate,
        endDate: finalEndDate,
        type: finalType,
        dayPortion: finalDayPortion,
        compensation: finalCompensation,
        paidVacationUnits: finalPaidVacationUnits,
        unpaidVacationUnits: finalUnpaidVacationUnits,
        autoUnpaidBecauseNoBalance: nextAutoUnpaidBecauseNoBalance,
        compensationLockedBySystem: nextCompensationLockedBySystem,
        status: AbsenceRequestStatus.APPROVED,
        decidedAt: new Date(),
        decidedById: admin.id,
      },
    });

    const absenceRows =
      finalType === AbsenceType.VACATION
        ? buildVacationAbsenceRowsWithSplit(
            existing.userId,
            days,
            finalPaidVacationUnits,
            finalUnpaidVacationUnits
          )
        : days.map((day) => ({
            userId: existing.userId,
            absenceDate: day,
            type: finalType,
            dayPortion: finalDayPortion,
            compensation: finalCompensation,
          }));

    const createdAbsences = await tx.absence.createMany({
      data: absenceRows,
      skipDuplicates: true,
    });

    return {
      updatedRequest,
      createdAbsences,
    };
  });

  const typeLabel =
    finalType === AbsenceType.VACATION ? "Urlaubsantrag" : "Krankheitsantrag";

  const compensationLabel =
    finalCompensation === AbsenceCompensation.UNPAID ? "unbezahlt" : "bezahlt";

  const startDate = toIsoDateUTC(finalStartDate);
  const endDate = toIsoDateUTC(finalEndDate);

  const dateLabel = portionLabel(
    finalType,
    finalDayPortion,
    startDate,
    endDate
  );

  await sendPushToUser(existing.userId, {
    title: "Antrag genehmigt",
    body: `Dein ${typeLabel.toLowerCase()} wurde genehmigt (${dateLabel}, ${compensationLabel}).`,
    url: buildPushUrl(
      `/kalender?openDate=${encodeURIComponent(startDate)}&absenceStart=${encodeURIComponent(startDate)}&absenceEnd=${encodeURIComponent(endDate)}&absenceType=${encodeURIComponent(finalType)}&absenceDayPortion=${encodeURIComponent(finalDayPortion)}&absenceCompensation=${encodeURIComponent(finalCompensation)}`
    ),
  });

  return NextResponse.json({
    ok: true,
    request: {
      id: existing.id,
      status: txResult.updatedRequest.status,
      decidedAt: txResult.updatedRequest.decidedAt?.toISOString() ?? null,
      decidedBy: {
        id: admin.id,
        fullName: admin.fullName,
      },
      user: {
        id: existing.user.id,
        fullName: existing.user.fullName,
      },
      type: finalType,
      dayPortion: finalDayPortion,
      compensation: finalCompensation,
      paidVacationUnits: finalPaidVacationUnits,
      unpaidVacationUnits: finalUnpaidVacationUnits,
      startDate,
      endDate,
    },
    createdAbsenceDays: txResult.createdAbsences.count,
    requestedDays: days.length,
  });
}