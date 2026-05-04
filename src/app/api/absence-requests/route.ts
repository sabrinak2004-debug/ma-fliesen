import { NextResponse } from "next/server";
import {
  AbsenceCompensation,
  AbsenceDayPortion,
  AbsenceRequestStatus,
  AbsenceType,
  Prisma,
} from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildPushUrl, sendPushToUser } from "@/lib/webpush";
import { translateAllLanguages, type SupportedLang } from "@/lib/translate";
import {
  ADMIN_ABSENCE_REQUEST_PUSH_TEXTS,
  EMPLOYEE_ABSENCE_REQUESTS_API_TEXTS,
  translate,
  type AdminAbsenceRequestPushTextKey,
  type AppUiLanguage,
  type EmployeeAbsenceRequestsApiTextKey,
} from "@/lib/i18n";

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

function getBerlinYearMonth(date: Date = new Date()): {
  year: number;
  month: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const yearText = parts.find((part) => part.type === "year")?.value;
  const monthText = parts.find((part) => part.type === "month")?.value;

  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    const fallback = new Date();
    return {
      year: fallback.getUTCFullYear(),
      month: fallback.getUTCMonth() + 1,
    };
  }

  return { year, month };
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

function endOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
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

type TranslationMap = Partial<Record<SupportedLang, string>>;

function isTranslationMap(value: Prisma.JsonValue | null | undefined): value is TranslationMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return true;
}

function toSupportedLang(language: string | null | undefined): SupportedLang {
  if (
    language === "DE" ||
    language === "EN" ||
    language === "IT" ||
    language === "TR" ||
    language === "SQ" ||
    language === "KU" ||
    language === "RO"
  ) {
    return language;
  }

  return "DE";
}

function getTranslatedText(
  originalText: string | null | undefined,
  translations: Prisma.JsonValue | null | undefined,
  language: string | null | undefined
): string {
  const fallback = originalText ?? "";
  const targetLanguage = toSupportedLang(language);

  if (!isTranslationMap(translations)) {
    return fallback;
  }

  const translated = translations[targetLanguage];
  return typeof translated === "string" && translated.trim() ? translated : fallback;
}

function toPrismaNullableJsonInput(
  value: TranslationMap | null
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

function toAppUiLanguage(value: string | null | undefined): AppUiLanguage {
  if (
    value === "DE" ||
    value === "EN" ||
    value === "IT" ||
    value === "TR" ||
    value === "SQ" ||
    value === "KU" ||
    value === "RO"
  ) {
    return value;
  }

  return "DE";
}

function translateAbsenceRequestText(
  language: AppUiLanguage,
  key: EmployeeAbsenceRequestsApiTextKey
): string {
  return translate(language, key, EMPLOYEE_ABSENCE_REQUESTS_API_TEXTS);
}

function translateAdminAbsenceRequestPushText(
  language: AppUiLanguage,
  key: AdminAbsenceRequestPushTextKey
): string {
  return translate(language, key, ADMIN_ABSENCE_REQUEST_PUSH_TEXTS);
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

function buildVacationCompensationPushLabel(
  language: AppUiLanguage,
  paidUnits: number,
  unpaidUnits: number,
  fallbackCompensation: AbsenceCompensation
): string {
  const paidDays = paidUnits / 2;
  const unpaidDays = unpaidUnits / 2;

  const paidLabel = translateAdminAbsenceRequestPushText(
    language,
    "compensationPaid"
  ).toLocaleLowerCase(toHtmlLocale(language));

  const unpaidLabel = translateAdminAbsenceRequestPushText(
    language,
    "compensationUnpaid"
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

  return fallbackCompensation === AbsenceCompensation.UNPAID
    ? translateAdminAbsenceRequestPushText(language, "compensationUnpaid")
    : translateAdminAbsenceRequestPushText(language, "compensationPaid");
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

export async function rebalanceAutoUnpaidVacationRequestsForYear(
  userId: string,
  year: number,
  effectiveDate: Date = new Date()
): Promise<void> {
  const yearStart = startOfUtcYear(year);
  const nextYearStart = startOfNextUtcYear(year);

  const effectiveDateUtc = endOfUtcDay(effectiveDate);

  const accruedUnits = Math.round(
    getAccruedVacationDaysForYearAtEffectiveDate(year, effectiveDateUtc) * 2
  );

  const requests = await prisma.absenceRequest.findMany({
    where: {
      userId,
      type: AbsenceType.VACATION,
      status: {
        in: [AbsenceRequestStatus.PENDING, AbsenceRequestStatus.APPROVED],
      },
      createdAt: {
        gte: yearStart,
        lt: nextYearStart,
        lte: effectiveDateUtc,
      },
    },
    select: {
      id: true,
      userId: true,
      startDate: true,
      endDate: true,
      dayPortion: true,
      status: true,
      compensation: true,
      paidVacationUnits: true,
      unpaidVacationUnits: true,
      autoUnpaidBecauseNoBalance: true,
      compensationLockedBySystem: true,
      createdAt: true,
    },
    orderBy: [
      { createdAt: "asc" },
      { startDate: "asc" },
      { endDate: "asc" },
      { id: "asc" },
    ],
  });

  let remainingAccruedUnits = accruedUnits;

  const updates = requests
    .map((request) => {
      const requestedUnits = getRequestVacationUnits(
        request.startDate,
        request.endDate,
        request.dayPortion
      );

      const isManualUnpaid =
        request.compensation === AbsenceCompensation.UNPAID &&
        !request.autoUnpaidBecauseNoBalance;

      if (isManualUnpaid) {
        return null;
      }

      const nextPaidUnits = Math.min(remainingAccruedUnits, requestedUnits);
      const nextUnpaidUnits = Math.max(0, requestedUnits - nextPaidUnits);

      remainingAccruedUnits = Math.max(
        0,
        remainingAccruedUnits - nextPaidUnits
      );

      const currentPaidUnits = getStoredPaidVacationUnits(request);
      const currentUnpaidUnits = getStoredUnpaidVacationUnits(request);

      const nextCompensation =
        nextPaidUnits > 0
          ? AbsenceCompensation.PAID
          : AbsenceCompensation.UNPAID;

      const nextAutoUnpaidBecauseNoBalance = nextUnpaidUnits > 0;
      const nextCompensationLockedBySystem = nextUnpaidUnits > 0;

      const changed =
        request.compensation !== nextCompensation ||
        currentPaidUnits !== nextPaidUnits ||
        currentUnpaidUnits !== nextUnpaidUnits ||
        request.autoUnpaidBecauseNoBalance !== nextAutoUnpaidBecauseNoBalance ||
        request.compensationLockedBySystem !== nextCompensationLockedBySystem;

      if (!changed) {
        return null;
      }

      return {
        id: request.id,
        userId: request.userId,
        startDate: request.startDate,
        endDate: request.endDate,
        dayPortion: request.dayPortion,
        status: request.status,
        nextCompensation,
        nextPaidUnits,
        nextUnpaidUnits,
        nextAutoUnpaidBecauseNoBalance,
        nextCompensationLockedBySystem,
      };
    })
    .filter(
      (
        value
      ): value is {
        id: string;
        userId: string;
        startDate: Date;
        endDate: Date;
        dayPortion: AbsenceDayPortion;
        status: AbsenceRequestStatus;
        nextCompensation: AbsenceCompensation;
        nextPaidUnits: number;
        nextUnpaidUnits: number;
        nextAutoUnpaidBecauseNoBalance: boolean;
        nextCompensationLockedBySystem: boolean;
      } => value !== null
    );

  if (updates.length === 0) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const update of updates) {
      await tx.absenceRequest.update({
        where: { id: update.id },
        data: {
          compensation: update.nextCompensation,
          paidVacationUnits: update.nextPaidUnits,
          unpaidVacationUnits: update.nextUnpaidUnits,
          autoUnpaidBecauseNoBalance: update.nextAutoUnpaidBecauseNoBalance,
          compensationLockedBySystem: update.nextCompensationLockedBySystem,
        },
      });

      if (update.status === AbsenceRequestStatus.APPROVED) {
        await tx.absence.deleteMany({
          where: {
            userId: update.userId,
            type: AbsenceType.VACATION,
            absenceDate: {
              gte: update.startDate,
              lte: update.endDate,
            },
          },
        });

        const days = buildEffectiveAbsenceDays(
          update.startDate,
          update.endDate,
          AbsenceType.VACATION,
          update.dayPortion
        );

        const absenceRows = buildVacationAbsenceRowsWithSplit(
          update.userId,
          days,
          update.nextPaidUnits,
          update.nextUnpaidUnits
        );

        if (absenceRows.length > 0) {
          await tx.absence.createMany({
            data: absenceRows,
            skipDuplicates: true,
          });
        }
      }
    }
  });
}

async function getVacationRequestDecisionForNewRequest(
  userId: string,
  startDate: Date,
  endDate: Date,
  dayPortion: AbsenceDayPortion,
  requestCreatedAt: Date
): Promise<{
  compensation: AbsenceCompensation;
  autoUnpaidBecauseNoBalance: boolean;
  compensationLockedBySystem: boolean;
  paidVacationUnits: number;
  unpaidVacationUnits: number;
}> {
  const balanceYear = requestCreatedAt.getUTCFullYear();
  const yearStart = startOfUtcYear(balanceYear);
  const requestCreatedAtEndOfDay = endOfUtcDay(requestCreatedAt);

  const existingRequests = await prisma.absenceRequest.findMany({
    where: {
      userId,
      type: AbsenceType.VACATION,
      status: {
        in: [AbsenceRequestStatus.PENDING, AbsenceRequestStatus.APPROVED],
      },
      createdAt: {
        gte: yearStart,
        lte: requestCreatedAtEndOfDay,
      },
    },
    select: {
      compensation: true,
      paidVacationUnits: true,
      unpaidVacationUnits: true,
      autoUnpaidBecauseNoBalance: true,
    },
  });

  const accruedUnits = Math.round(
    getAccruedVacationDaysForYearAtEffectiveDate(
      balanceYear,
      requestCreatedAt
    ) * 2
  );

  const reservedPaidUnits = existingRequests.reduce((sum, request) => {
    const isManualUnpaid =
      request.compensation === AbsenceCompensation.UNPAID &&
      !request.autoUnpaidBecauseNoBalance;

    if (isManualUnpaid) {
      return sum;
    }

    return sum + request.paidVacationUnits;
  }, 0);

  const requestedUnits = getRequestVacationUnits(startDate, endDate, dayPortion);
  const availableUnits = Math.max(0, accruedUnits - reservedPaidUnits);

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

  const vacationRequests = await prisma.absenceRequest.findMany({
    where: {
      userId,
      type: AbsenceType.VACATION,
      status: {
        in: [AbsenceRequestStatus.PENDING, AbsenceRequestStatus.APPROVED],
      },
      createdAt: {
        gte: yearStart,
        lt: nextYearStart,
        lte: monthEnd,
      },
    },
    select: {
      compensation: true,
      paidVacationUnits: true,
      autoUnpaidBecauseNoBalance: true,
    },
  });

  const accruedUnits = Math.round(
    Math.min(ANNUAL_VACATION_DAYS, month * MONTHLY_VACATION_ACCRUAL_DAYS) * 2
  );

  const reservedPaidUnits = vacationRequests.reduce((sum, request) => {
    const isManualUnpaid =
      request.compensation === AbsenceCompensation.UNPAID &&
      !request.autoUnpaidBecauseNoBalance;

    if (isManualUnpaid) {
      return sum;
    }

    return sum + request.paidVacationUnits;
  }, 0);

  return Math.max(0, (accruedUnits - reservedPaidUnits) / 2);
}

function mapRequest(
  r: {
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
    noteEmployeeTranslations: Prisma.JsonValue | null;
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
  },
  language: string | null | undefined
) {
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
    noteEmployee: getTranslatedText(
      r.noteEmployee,
      r.noteEmployeeTranslations,
      language
    ),
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
  const language = toAppUiLanguage(session?.language);

  if (!session) {
    return NextResponse.json(
      { ok: false, error: translateAbsenceRequestText(language, "notLoggedInWithPeriod") },
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
        { ok: false, error: "INVALID_MONTH_FORMAT" },
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

  const now = new Date();
  const currentBerlinYearMonth = getBerlinYearMonth(now);

  await rebalanceAutoUnpaidVacationRequestsForYear(
    session.userId,
    currentBerlinYearMonth.year,
    now
  );

  const remainingPaidVacationDaysForMonth =
    await getRemainingPaidVacationDaysForMonth(
      session.userId,
      currentBerlinYearMonth.year,
      currentBerlinYearMonth.month
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
    requests: requests.map((request) => mapRequest(request, session.language)),
    vacationRequestBalance: {
      remainingPaidVacationDaysForMonth,
    },
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  const language = toAppUiLanguage(session?.language);

  if (!session) {
    return NextResponse.json(
      { ok: false, error: translateAbsenceRequestText(language, "notLoggedInWithPeriod") },
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
      { ok: false, error: translateAbsenceRequestText(language, "dateMustBeYmd") },
      { status: 400 }
    );
  }

  if (!isAbsenceType(typeRaw)) {
    return NextResponse.json(
      { ok: false, error: translateAbsenceRequestText(language, "invalidAbsenceType") },
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
      { ok: false, error: translateAbsenceRequestText(language, "endBeforeStart") },
      { status: 400 }
    );
  }

  if (start.getUTCFullYear() !== end.getUTCFullYear()) {
    return NextResponse.json(
      {
        ok: false,
        error: translateAbsenceRequestText(language, "crossYearRequestsNotSupported"),
      },
      { status: 400 }
    );
  }

  if (typeRaw === "SICK" && dayPortion !== AbsenceDayPortion.FULL_DAY) {
    return NextResponse.json(
      { ok: false, error: translateAbsenceRequestText(language, "sickOnlyFullDayRequested") },
      { status: 400 }
    );
  }

  if (typeRaw === "SICK" && finalCompensation !== AbsenceCompensation.PAID) {
    return NextResponse.json(
      { ok: false, error: translateAbsenceRequestText(language, "sickCannotBeRequestedUnpaid") },
      { status: 400 }
    );
  }

  if (
    dayPortion === AbsenceDayPortion.HALF_DAY &&
    typeRaw !== "VACATION"
  ) {
    return NextResponse.json(
      { ok: false, error: translateAbsenceRequestText(language, "halfDaysOnlyForVacation") },
      { status: 400 }
    );
  }

  if (
    dayPortion === AbsenceDayPortion.HALF_DAY &&
    startDate !== endDate
  ) {
    return NextResponse.json(
      { ok: false, error: translateAbsenceRequestText(language, "halfVacationOnlySingleDateRequest") },
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
          error: translateAbsenceRequestText(language, "vacationNoWeekdays"),
        },
        { status: 400 }
      );
    }
  }

  const requestCreatedAt = new Date();

  if (typeRaw === "VACATION") {
    const requestedUnits = getRequestVacationUnits(start, end, dayPortion);

    if (requestedCompensation === AbsenceCompensation.PAID) {
      const decision = await getVacationRequestDecisionForNewRequest(
        session.userId,
        start,
        end,
        dayPortion,
        requestCreatedAt
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
        error: translateAbsenceRequestText(language, "approvedAbsenceAlreadyExists"),
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
        error: translateAbsenceRequestText(language, "pendingRequestAlreadyExists"),
      },
      { status: 409 }
    );
  }

  let noteEmployeeSourceLanguage: SupportedLang | null = null;
  let noteEmployeeTranslations: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
    Prisma.JsonNull;

  if (noteEmployee) {
    try {
      const translationResult = await translateAllLanguages(noteEmployee);
      noteEmployeeSourceLanguage = translationResult.sourceLanguage;
      noteEmployeeTranslations = toPrismaNullableJsonInput(
        translationResult.translations
      );
    } catch (error) {
      console.error("Translation for noteEmployee failed:", error);
    }
  }

  const created = await prisma.absenceRequest.create({
    data: {
      userId: session.userId,
      startDate: start,
      endDate: end,
      createdAt: typeRaw === AbsenceType.VACATION ? requestCreatedAt : undefined,
      type: typeRaw,
      dayPortion,
      status: AbsenceRequestStatus.PENDING,
      compensation: finalCompensation,
      paidVacationUnits,
      unpaidVacationUnits,
      autoUnpaidBecauseNoBalance,
      compensationLockedBySystem,
      noteEmployee: noteEmployee || null,
      noteEmployeeSourceLanguage,
      noteEmployeeTranslations,
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

  const adminTargetUrl =
    typeRaw === "VACATION"
      ? buildPushUrl("/admin/urlaubsantraege")
      : buildPushUrl("/admin/krankheitsantraege");

  const admins = await prisma.appUser.findMany({
    where: {
      companyId: session.companyId,
      role: "ADMIN",
      isActive: true,
    },
    select: {
      id: true,
      language: true,
    },
  });

  for (const adminUser of admins) {
    const adminLanguage = toAppUiLanguage(adminUser.language);

    const typeLabel =
      typeRaw === "VACATION"
        ? translateAdminAbsenceRequestPushText(adminLanguage, "typeVacation")
        : translateAdminAbsenceRequestPushText(adminLanguage, "typeSick");

    const compensationLabel =
      typeRaw === "VACATION"
        ? buildVacationCompensationPushLabel(
            adminLanguage,
            paidVacationUnits,
            unpaidVacationUnits,
            finalCompensation
          )
        : "";

    const dateLabel =
      dayPortion === AbsenceDayPortion.HALF_DAY
        ? `${startDate} (${translateAdminAbsenceRequestPushText(adminLanguage, "scopeHalfDay")})`
        : startDate === endDate
          ? startDate
          : `${startDate} - ${endDate}`;

    await sendPushToUser(adminUser.id, {
      title: translateAbsenceRequestText(
        adminLanguage,
        "newAbsenceRequestPushTitle"
      ),
      body: `${session.fullName}: ${typeLabel} (${dateLabel}${
        typeRaw === "VACATION" ? `, ${compensationLabel}` : ""
      })`,
      url: adminTargetUrl,
    });
  }

  return NextResponse.json({
    ok: true,
    request: mapRequest(created, session.language),
  });
}