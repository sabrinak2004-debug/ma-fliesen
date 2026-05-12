import { NextResponse } from "next/server";
import Holidays from "date-holidays";
import {
  AbsenceCompensation,
  AbsenceDayPortion,
  AbsenceRequestStatus,
  AbsenceTimeMode,
  AbsenceType,
  Prisma,
  SickLeaveKind,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { buildPushUrl, sendPushToUser } from "@/lib/webpush";
import {
  ADMIN_ABSENCE_REQUESTS_API_TEXTS,
  normalizeAppUiLanguage,
  translate,
  type AdminAbsenceRequestsApiTextKey,
  type AppUiLanguage,
} from "@/lib/i18n";

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

function toHHMMUTC(date: Date | null): string | null {
  if (!date) return null;

  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function isTimeRangeDoctorAppointment(args: {
  type: AbsenceType;
  sickLeaveKind: SickLeaveKind | null;
  timeMode: AbsenceTimeMode;
}): boolean {
  return (
    args.type === AbsenceType.SICK &&
    args.sickLeaveKind === SickLeaveKind.DOCTOR_APPOINTMENT &&
    args.timeMode === AbsenceTimeMode.TIME_RANGE
  );
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

function translateAdminAbsenceRequestText(
  language: AppUiLanguage,
  key: AdminAbsenceRequestsApiTextKey
): string {
  return translate(language, key, ADMIN_ABSENCE_REQUESTS_API_TEXTS);
}

function formatText(
  template: string,
  values: Record<string, string>
): string {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, value);
  }, template);
}

function portionLabel(
  language: AppUiLanguage,
  type: AbsenceType,
  dayPortion: AbsenceDayPortion,
  startDate: string,
  endDate: string
): string {
  if (type === AbsenceType.VACATION && dayPortion === AbsenceDayPortion.HALF_DAY) {
    return formatText(
      translateAdminAbsenceRequestText(language, "halfVacationDayOn"),
      { date: startDate }
    );
  }

  if (startDate === endDate) {
    return startDate;
  }

  return formatText(
    translateAdminAbsenceRequestText(language, "fromTo"),
    {
      startDate,
      endDate,
    }
  );
}

function getRequestTypeLabel(
  language: AppUiLanguage,
  type: AbsenceType
): string {
  return type === AbsenceType.VACATION
    ? translateAdminAbsenceRequestText(language, "vacationRequestLabel")
    : translateAdminAbsenceRequestText(language, "sickRequestLabel");
}

function getCompensationLabel(
  language: AppUiLanguage,
  compensation: AbsenceCompensation
): string {
  return compensation === AbsenceCompensation.UNPAID
    ? translateAdminAbsenceRequestText(language, "unpaid")
    : translateAdminAbsenceRequestText(language, "paid");
}

function formatVacationDaysForPush(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function toHtmlLocale(language: AppUiLanguage): string {
  if (language === "DE") return "de-DE";
  if (language === "EN") return "en-US";
  if (language === "IT") return "it-IT";
  if (language === "TR") return "tr-TR";
  if (language === "SQ") return "sq-AL";
  if (language === "KU") return "ku";
  if (language === "RO") return "ro-RO";
  return "de-DE";
}

function getVacationDayLabelForPush(
  language: AppUiLanguage,
  value: number
): string {
  const labels: Record<AppUiLanguage, { singular: string; plural: string }> = {
    DE: { singular: "Tag", plural: "Tage" },
    EN: { singular: "day", plural: "days" },
    IT: { singular: "giorno", plural: "giorni" },
    TR: { singular: "gün", plural: "gün" },
    SQ: { singular: "ditë", plural: "ditë" },
    KU: { singular: "roj", plural: "roj" },
    RO: { singular: "zi", plural: "zile" },
  };

  return Math.abs(value) === 1
    ? labels[language].singular
    : labels[language].plural;
}

function buildApprovedVacationCompensationPushLabel(
  language: AppUiLanguage,
  paidUnits: number,
  unpaidUnits: number,
  fallbackCompensation: AbsenceCompensation
): string {
  const paidDays = paidUnits / 2;
  const unpaidDays = unpaidUnits / 2;

  const paidLabel = getCompensationLabel(
    language,
    AbsenceCompensation.PAID
  ).toLocaleLowerCase(toHtmlLocale(language));

  const unpaidLabel = getCompensationLabel(
    language,
    AbsenceCompensation.UNPAID
  ).toLocaleLowerCase(toHtmlLocale(language));

  if (paidDays > 0 && unpaidDays > 0) {
    return `${formatVacationDaysForPush(paidDays)} ${getVacationDayLabelForPush(
      language,
      paidDays
    )} ${paidLabel} · ${formatVacationDaysForPush(
      unpaidDays
    )} ${getVacationDayLabelForPush(language, unpaidDays)} ${unpaidLabel}`;
  }

  if (paidDays > 0) {
    return `${formatVacationDaysForPush(paidDays)} ${getVacationDayLabelForPush(
      language,
      paidDays
    )} ${paidLabel}`;
  }

  if (unpaidDays > 0) {
    return `${formatVacationDaysForPush(
      unpaidDays
    )} ${getVacationDayLabelForPush(language, unpaidDays)} ${unpaidLabel}`;
  }

  return getCompensationLabel(language, fallbackCompensation);
}

function getDayPortionUnits(dayPortion: AbsenceDayPortion): number {
  return dayPortion === AbsenceDayPortion.HALF_DAY ? 1 : 2;
}

async function refreshApprovedVacationRequestUnitsAfterSickOverwrite(
  tx: Prisma.TransactionClient,
  userId: string,
  fromDate: Date,
  toDate: Date
): Promise<void> {
  const affectedVacationRequests = await tx.absenceRequest.findMany({
    where: {
      userId,
      type: AbsenceType.VACATION,
      status: AbsenceRequestStatus.APPROVED,
      startDate: {
        lte: toDate,
      },
      endDate: {
        gte: fromDate,
      },
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
    },
  });

  for (const request of affectedVacationRequests) {
    const remainingVacationAbsences = await tx.absence.findMany({
      where: {
        userId,
        type: AbsenceType.VACATION,
        absenceDate: {
          gte: request.startDate,
          lte: request.endDate,
        },
      },
      select: {
        dayPortion: true,
        compensation: true,
      },
    });

    const paidVacationUnits = remainingVacationAbsences.reduce((sum, absence) => {
      if (absence.compensation !== AbsenceCompensation.PAID) {
        return sum;
      }

      return sum + getDayPortionUnits(absence.dayPortion);
    }, 0);

    const unpaidVacationUnits = remainingVacationAbsences.reduce((sum, absence) => {
      if (absence.compensation !== AbsenceCompensation.UNPAID) {
        return sum;
      }

      return sum + getDayPortionUnits(absence.dayPortion);
    }, 0);

    await tx.absenceRequest.update({
      where: {
        id: request.id,
      },
      data: {
        paidVacationUnits,
        unpaidVacationUnits,
        compensation:
          paidVacationUnits > 0
            ? AbsenceCompensation.PAID
            : AbsenceCompensation.UNPAID,
        autoUnpaidBecauseNoBalance: unpaidVacationUnits > 0,
        compensationLockedBySystem: unpaidVacationUnits > 0,
      },
    });
  }
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
      {
        ok: false,
        error: translateAdminAbsenceRequestText("DE", "missingRequestId"),
      },
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
          language: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json(
      {
        ok: false,
        error: translateAdminAbsenceRequestText("DE", "requestNotFound"),
      },
      { status: 404 }
    );
  }

  const employeeLanguage = normalizeAppUiLanguage(existing.user.language);

  if (existing.user.companyId !== admin.companyId) {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  if (!existing.user.isActive) {
    return NextResponse.json(
      {
        ok: false,
        error: translateAdminAbsenceRequestText(employeeLanguage, "employeeInactive"),
      },
      { status: 409 }
    );
  }

  if (existing.status !== AbsenceRequestStatus.PENDING) {
    return NextResponse.json(
      {
        ok: false,
        error: translateAdminAbsenceRequestText(
          employeeLanguage,
          "onlyPendingCanBeApproved"
        ),
      },
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

  const finalSickLeaveKind = finalType === AbsenceType.SICK
    ? existing.sickLeaveKind ?? SickLeaveKind.SICK_LEAVE
    : null;

  const finalTimeMode =
    finalType === AbsenceType.SICK
      ? existing.timeMode
      : AbsenceTimeMode.FULL_DAY;

  const finalStartTime = existing.startTime;
  const finalEndTime = existing.endTime;
  const finalPaidMinutes = existing.paidMinutes;

  const finalIsDoctorAppointmentTimeRange = isTimeRangeDoctorAppointment({
    type: finalType,
    sickLeaveKind: finalSickLeaveKind,
    timeMode: finalTimeMode,
  });

  if (finalType === AbsenceType.SICK) {
    finalDayPortion = AbsenceDayPortion.FULL_DAY;
    finalCompensation = AbsenceCompensation.PAID;

    if (finalIsDoctorAppointmentTimeRange) {
      if (toIsoDateUTC(finalStartDate) !== toIsoDateUTC(finalEndDate)) {
        return NextResponse.json(
          {
            ok: false,
            error: "Ein Arzttermin-Zeitraum darf nur für einen einzelnen Tag genehmigt werden.",
          },
          { status: 400 }
        );
      }

      if (!finalStartTime || !finalEndTime || finalPaidMinutes <= 0) {
        return NextResponse.json(
          {
            ok: false,
            error: "Der Arzttermin-Zeitraum ist unvollständig.",
          },
          { status: 400 }
        );
      }
    }
  }

  if (finalEndDate < finalStartDate) {
    return NextResponse.json(
      {
        ok: false,
        error: translateAdminAbsenceRequestText(employeeLanguage, "endBeforeStart"),
      },
      { status: 400 }
    );
  }

  if (finalStartDate.getUTCFullYear() !== finalEndDate.getUTCFullYear()) {
    return NextResponse.json(
      {
        ok: false,
        error: translateAdminAbsenceRequestText(
          employeeLanguage,
          "crossYearApprovalNotSupported"
        ),
      },
      { status: 400 }
    );
  }

  if (
    finalType !== AbsenceType.VACATION &&
    finalDayPortion === AbsenceDayPortion.HALF_DAY
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: translateAdminAbsenceRequestText(
          employeeLanguage,
          "halfDaysOnlyForVacation"
        ),
      },
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
      ...(finalType === AbsenceType.SICK
        ? {
            type: AbsenceType.SICK,
          }
        : {}),
      OR: finalIsDoctorAppointmentTimeRange
        ? [
            {
              timeMode: AbsenceTimeMode.FULL_DAY,
            },
            {
              timeMode: AbsenceTimeMode.TIME_RANGE,
              startTime: {
                lt: finalEndTime ?? undefined,
              },
              endTime: {
                gt: finalStartTime ?? undefined,
              },
            },
          ]
        : undefined,
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
        error: translateAdminAbsenceRequestText(
          employeeLanguage,
          "approvedAbsenceAlreadyExists"
        ),
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

  if (finalType === AbsenceType.SICK && days.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Der Zeitraum enthält nur Feiertage. Es werden keine Krankheitstage eingetragen.",
      },
      { status: 400 }
    );
  }

  if (finalType === AbsenceType.VACATION && days.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: translateAdminAbsenceRequestText(
          employeeLanguage,
          "vacationNoWeekdays"
        ),
      },
      { status: 400 }
    );
  }

  let nextAutoUnpaidBecauseNoBalance = existing.autoUnpaidBecauseNoBalance;
  let nextCompensationLockedBySystem = existing.compensationLockedBySystem;

  if (finalType === AbsenceType.VACATION) {
    const decisionDate = new Date();
    const balanceYear = decisionDate.getUTCFullYear();
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
        createdAt: {
          gte: yearStart,
          lt: nextYearStart,
          lte: decisionDate,
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
      getAccruedVacationDaysForYearAtEffectiveDate(balanceYear, decisionDate) * 2
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
        sickLeaveKind: finalSickLeaveKind,
        timeMode: finalTimeMode,
        startTime: finalStartTime,
        endTime: finalEndTime,
        paidMinutes: finalPaidMinutes,
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
            sickLeaveKind: finalSickLeaveKind,
            timeMode: finalTimeMode,
            startTime: finalIsDoctorAppointmentTimeRange ? finalStartTime : null,
            endTime: finalIsDoctorAppointmentTimeRange ? finalEndTime : null,
            paidMinutes: finalIsDoctorAppointmentTimeRange ? finalPaidMinutes : 0,
          }));

    if (finalType === AbsenceType.SICK && absenceRows.length > 0) {
      await tx.absence.deleteMany({
        where: {
          userId: existing.userId,
          type: AbsenceType.VACATION,
          absenceDate: {
            in: absenceRows.map((row) => row.absenceDate),
          },
        },
      });

      await refreshApprovedVacationRequestUnitsAfterSickOverwrite(
        tx,
        existing.userId,
        finalStartDate,
        finalEndDate
      );
    }

    const createdAbsences = await tx.absence.createMany({
      data: absenceRows,
      skipDuplicates: true,
    });

    return {
      updatedRequest,
      createdAbsences,
    };
  });

  if (finalType === AbsenceType.SICK) {
    await import("@/app/api/absence-requests/route").then((mod) =>
      mod.rebalanceAutoUnpaidVacationRequestsForYear(
        existing.userId,
        finalStartDate.getUTCFullYear(),
        new Date()
      )
    );
  }

  const startDate = toIsoDateUTC(finalStartDate);
  const endDate = toIsoDateUTC(finalEndDate);

  const typeLabel = getRequestTypeLabel(employeeLanguage, finalType);
  const compensationLabel =
    finalType === AbsenceType.VACATION
      ? buildApprovedVacationCompensationPushLabel(
          employeeLanguage,
          finalPaidVacationUnits,
          finalUnpaidVacationUnits,
          finalCompensation
        )
      : getCompensationLabel(employeeLanguage, finalCompensation);

  const dateLabel = portionLabel(
    employeeLanguage,
    finalType,
    finalDayPortion,
    startDate,
    endDate
  );

  await sendPushToUser(existing.userId, {
    title: translateAdminAbsenceRequestText(employeeLanguage, "approvedPushTitle"),
    body: formatText(
      translateAdminAbsenceRequestText(employeeLanguage, "approvedPushBody"),
      {
        type: typeLabel,
        dateLabel,
        compensationLabel,
      }
    ),
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
      sickLeaveKind: finalSickLeaveKind,
      timeMode: finalTimeMode,
      startTime: toHHMMUTC(finalStartTime),
      endTime: toHHMMUTC(finalEndTime),
      paidMinutes: finalPaidMinutes,
      paidVacationUnits: finalPaidVacationUnits,
      unpaidVacationUnits: finalUnpaidVacationUnits,
      startDate,
      endDate,
    },
    createdAbsenceDays: txResult.createdAbsences.count,
    requestedDays: days.length,
  });
}