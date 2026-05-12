import { NextResponse } from "next/server";
import Holidays from "date-holidays";
import {
  AbsenceCompensation,
  AbsenceDayPortion,
  AbsenceRequestStatus,
  AbsenceType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateAbsenceRequestBody = {
  startDate?: unknown;
  endDate?: unknown;
  type?: unknown;
  dayPortion?: unknown;
  compensation?: unknown;
  paidVacationUnits?: unknown;
  unpaidVacationUnits?: unknown;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function getOptionalFiniteNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
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

function isAbsenceType(v: string): v is AbsenceType {
  return v === "VACATION" || v === "SICK";
}

function isAbsenceDayPortion(v: string): v is AbsenceDayPortion {
  return v === "FULL_DAY" || v === "HALF_DAY";
}

function isAbsenceCompensation(v: string): v is AbsenceCompensation {
  return v === "PAID" || v === "UNPAID";
}

function isUtcWeekday(date: Date): boolean {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
}

function getBadenWuerttembergNonWorkingHolidaySetForYears(
  startYear: number,
  endYear: number
): Set<string> {
  const holidays = new Holidays("DE", "BW");
  const result = new Set<string>();

  for (let year = startYear; year <= endYear; year += 1) {
    for (const holiday of holidays.getHolidays(year)) {
      if (holiday.type === "public") {
        result.add(holiday.date.slice(0, 10));
      }
    }
  }

  return result;
}

function isBadenWuerttembergNonWorkingHolidayUtc(
  date: Date,
  holidaySet: Set<string>
): boolean {
  return holidaySet.has(toIsoDateUTC(date));
}

function buildEffectiveAbsenceDays(
  startDate: Date,
  endDate: Date,
  type: AbsenceType,
  dayPortion: AbsenceDayPortion
): Date[] {
  const holidaySet = getBadenWuerttembergNonWorkingHolidaySetForYears(
    startDate.getUTCFullYear(),
    endDate.getUTCFullYear()
  );

  if (dayPortion === AbsenceDayPortion.HALF_DAY) {
    if (isBadenWuerttembergNonWorkingHolidayUtc(startDate, holidaySet)) {
      return [];
    }

    if (type === AbsenceType.VACATION && !isUtcWeekday(startDate)) {
      return [];
    }

    return [new Date(startDate)];
  }

  const out: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const copy = new Date(current);
    const isHoliday = isBadenWuerttembergNonWorkingHolidayUtc(copy, holidaySet);

    if (!isHoliday && type === AbsenceType.VACATION && isUtcWeekday(copy)) {
      out.push(copy);
    }

    if (!isHoliday && type === AbsenceType.SICK) {
      out.push(copy);
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return out;
}

function getRequestedVacationUnits(
  startDate: Date,
  endDate: Date,
  dayPortion: AbsenceDayPortion
): number {
  if (dayPortion === AbsenceDayPortion.HALF_DAY) {
    return 1;
  }

  return buildEffectiveAbsenceDays(
    startDate,
    endDate,
    AbsenceType.VACATION,
    dayPortion
  ).length * 2;
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

export async function PATCH(req: Request, context: RouteContext) {
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
  const body: UpdateAbsenceRequestBody = isRecord(raw) ? raw : {};

  const startDateRaw = getString(body.startDate).trim();
  const endDateRaw = getString(body.endDate).trim();
  const typeRaw = getString(body.type).trim();
  const dayPortionRaw = getString(body.dayPortion).trim();
  const compensationRaw = getString(body.compensation).trim();
  const paidVacationUnitsRaw = getOptionalFiniteNumber(body.paidVacationUnits);
  const unpaidVacationUnitsRaw = getOptionalFiniteNumber(body.unpaidVacationUnits);

  if (
    !isYYYYMMDD(startDateRaw) ||
    !isYYYYMMDD(endDateRaw) ||
    !isAbsenceType(typeRaw) ||
    !isAbsenceDayPortion(dayPortionRaw) ||
    !isAbsenceCompensation(compensationRaw)
  ) {
    return NextResponse.json(
      { ok: false, error: "Ungültige Daten." },
      { status: 400 }
    );
  }

  const startDate = dateOnlyUTC(startDateRaw);
  const endDate = dateOnlyUTC(endDateRaw);

  if (endDate < startDate) {
    return NextResponse.json(
      { ok: false, error: "Ende darf nicht vor Start liegen." },
      { status: 400 }
    );
  }

  if (typeRaw === "SICK" && dayPortionRaw !== AbsenceDayPortion.FULL_DAY) {
    return NextResponse.json(
      { ok: false, error: "Krankheit kann nur ganztägig sein." },
      { status: 400 }
    );
  }

  if (typeRaw === "SICK" && compensationRaw !== AbsenceCompensation.PAID) {
    return NextResponse.json(
      { ok: false, error: "Krankheit darf nicht unbezahlt sein." },
      { status: 400 }
    );
  }

  if (dayPortionRaw === "HALF_DAY" && typeRaw !== "VACATION") {
    return NextResponse.json(
      { ok: false, error: "Halbe Tage sind nur für Urlaub erlaubt." },
      { status: 400 }
    );
  }

  if (
    paidVacationUnitsRaw !== null &&
    (!Number.isInteger(paidVacationUnitsRaw) || paidVacationUnitsRaw < 0)
  ) {
    return NextResponse.json(
      { ok: false, error: "paidVacationUnits ist ungültig." },
      { status: 400 }
    );
  }

  if (
    unpaidVacationUnitsRaw !== null &&
    (!Number.isInteger(unpaidVacationUnitsRaw) || unpaidVacationUnitsRaw < 0)
  ) {
    return NextResponse.json(
      { ok: false, error: "unpaidVacationUnits ist ungültig." },
      { status: 400 }
    );
  }

  if (startDate.getUTCFullYear() !== endDate.getUTCFullYear()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Jahresübergreifende Abwesenheiten werden aktuell noch nicht unterstützt.",
      },
      { status: 400 }
    );
  }

  const existing = await prisma.absenceRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      userId: true,
      status: true,
      type: true,
      startDate: true,
      endDate: true,
      dayPortion: true,
      compensation: true,
      paidVacationUnits: true,
      unpaidVacationUnits: true,
      user: {
        select: {
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

  if (
    existing.status !== AbsenceRequestStatus.APPROVED &&
    existing.status !== AbsenceRequestStatus.PENDING
  ) {
    return NextResponse.json(
      { ok: false, error: "Nur offene oder genehmigte Anträge können geändert werden." },
      { status: 409 }
    );
  }

  const requestedVacationUnits =
    typeRaw === AbsenceType.VACATION
      ? getRequestedVacationUnits(startDate, endDate, dayPortionRaw)
      : 0;

  const nextPaidVacationUnits =
    typeRaw === AbsenceType.VACATION
      ? paidVacationUnitsRaw !== null || unpaidVacationUnitsRaw !== null
        ? paidVacationUnitsRaw ?? 0
        : compensationRaw === AbsenceCompensation.PAID
          ? requestedVacationUnits
          : 0
      : 0;

  const nextUnpaidVacationUnits =
    typeRaw === AbsenceType.VACATION
      ? paidVacationUnitsRaw !== null || unpaidVacationUnitsRaw !== null
        ? unpaidVacationUnitsRaw ?? 0
        : compensationRaw === AbsenceCompensation.UNPAID
          ? requestedVacationUnits
          : 0
      : 0;
  if (
    typeRaw === AbsenceType.VACATION &&
    nextPaidVacationUnits + nextUnpaidVacationUnits !== requestedVacationUnits
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Die Aufteilung in bezahlte und unbezahlte Urlaubseinheiten passt nicht zum Zeitraum.",
      },
      { status: 400 }
    );
  }

  const updated = await prisma.absenceRequest.update({
    where: { id: requestId },
    data: {
      startDate,
      endDate,
      type: typeRaw,
      dayPortion: dayPortionRaw,
      compensation: compensationRaw,
      paidVacationUnits: nextPaidVacationUnits,
      unpaidVacationUnits: nextUnpaidVacationUnits,
      autoUnpaidBecauseNoBalance: false,
      compensationLockedBySystem: false,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    request: {
      id: updated.id,
      status: updated.status,
    },
  });
}

export async function DELETE(_req: Request, context: RouteContext) {
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

  const existing = await prisma.absenceRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      userId: true,
      status: true,
      startDate: true,
      endDate: true,
      type: true,
      dayPortion: true,
      compensation: true,
      paidVacationUnits: true,
      unpaidVacationUnits: true,
      user: {
        select: {
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

  await prisma.$transaction(async (tx) => {
    if (existing.status === AbsenceRequestStatus.APPROVED) {
      if (existing.type === AbsenceType.VACATION) {
        const days = buildEffectiveAbsenceDays(
          existing.startDate,
          existing.endDate,
          existing.type,
          existing.dayPortion
        );

        const absenceRows = buildVacationAbsenceRowsWithSplit(
          existing.userId,
          days,
          existing.paidVacationUnits,
          existing.unpaidVacationUnits
        );

        for (const row of absenceRows) {
          await tx.absence.deleteMany({
            where: {
              userId: row.userId,
              type: row.type,
              dayPortion: row.dayPortion,
              compensation: row.compensation,
              absenceDate: row.absenceDate,
            },
          });
        }
      } else {
        const dates = buildEffectiveAbsenceDays(
          existing.startDate,
          existing.endDate,
          existing.type,
          existing.dayPortion
        );

        await tx.absence.deleteMany({
          where: {
            userId: existing.userId,
            type: existing.type,
            dayPortion: existing.dayPortion,
            compensation: existing.compensation,
            absenceDate: {
              in: dates,
            },
          },
        });
      }
    }

    await tx.absenceRequest.delete({
      where: { id: requestId },
    });
  });

  return NextResponse.json({
    ok: true,
    deletedId: existing.id,
    removedApprovedAbsences: existing.status === AbsenceRequestStatus.APPROVED,
    range: {
      startDate: toIsoDateUTC(existing.startDate),
      endDate: toIsoDateUTC(existing.endDate),
    },
  });
}