import { NextResponse } from "next/server";
import Holidays from "date-holidays";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  AbsenceCompensation,
  AbsenceDayPortion,
  AbsenceTimeMode,
  AbsenceType,
  Role,
  SickLeaveKind,
} from "@prisma/client";
import {
  ADMIN_TASKS_UI_TEXTS,
  translate,
  type AdminTasksTextKey,
  type AppUiLanguage,
} from "@/lib/i18n";

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
  oldPaidVacationUnits?: unknown;
  oldUnpaidVacationUnits?: unknown;
  newPaidVacationUnits?: unknown;
  newUnpaidVacationUnits?: unknown;

  userId?: unknown;
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

function toHHMMUTC(date: Date | null): string | null {
  if (!date) return null;

  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
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
    if (
      type === AbsenceType.VACATION &&
      (!isUtcWeekday(startDate) ||
        isBadenWuerttembergNonWorkingHolidayUtc(startDate, holidaySet))
    ) {
      return [];
    }

    return [new Date(startDate)];
  }

  const out: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const copy = new Date(current);

    if (type === AbsenceType.VACATION) {
      if (
        isUtcWeekday(copy) &&
        !isBadenWuerttembergNonWorkingHolidayUtc(copy, holidaySet)
      ) {
        out.push(copy);
      }
    } else {
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

type AbsenceDTO = {
  id: string;
  absenceDate: string;
  type: "VACATION" | "SICK";
  dayPortion: "FULL_DAY" | "HALF_DAY";
  compensation: "PAID" | "UNPAID";
  sickLeaveKind: SickLeaveKind | null;
  timeMode: AbsenceTimeMode;
  startTime: string | null;
  endTime: string | null;
  paidMinutes: number;
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

function absenceDayValueForSummary(absence: AbsenceDTO): number {
  if (
    absence.type === "SICK" &&
    absence.sickLeaveKind === SickLeaveKind.DOCTOR_APPOINTMENT &&
    absence.timeMode === AbsenceTimeMode.TIME_RANGE
  ) {
    return Math.max(0, absence.paidMinutes) / (8 * 60);
  }

  return absence.dayPortion === "HALF_DAY" ? 0.5 : 1;
}

function okJson(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

async function findActiveCompanyUser(userId: string, companyId: string) {
  return prisma.appUser.findFirst({
    where: {
      id: userId,
      companyId,
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
    },
  });
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

function translateAbsenceText(
  language: AppUiLanguage,
  key: AdminTasksTextKey
): string {
  return translate(language, key, ADMIN_TASKS_UI_TEXTS);
}

export async function GET(req: Request) {
  const session = await getSession();
  const language = toAppUiLanguage(session?.language);

  if (!session) {
    return okJson(
      { error: translateAbsenceText(language, "notLoggedIn") },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const month = (url.searchParams.get("month") ?? "").trim();
  const fromQ = (url.searchParams.get("from") ?? "").trim();
  const toQ = (url.searchParams.get("to") ?? "").trim();
  const userIdQ = (url.searchParams.get("userId") ?? "").trim();

  const isAdmin = session.role === Role.ADMIN;

  const effectiveUserWhere = isAdmin
    ? userIdQ
      ? {
          userId: userIdQ,
          user: {
            companyId: session.companyId,
          },
        }
      : {
          user: {
            companyId: session.companyId,
          },
        }
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
      return okJson(
        { error: translateAbsenceText(language, "toBeforeFrom") },
        { status: 400 }
      );
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
    sickLeaveKind: a.sickLeaveKind,
    timeMode: a.timeMode,
    startTime: toHHMMUTC(a.startTime),
    endTime: toHHMMUTC(a.endTime),
    paidMinutes: a.paidMinutes,
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

    const value = absenceDayValueForSummary(a);

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
    ok: true,
    absences,
    groupsByDay,
    summaryByUser,
    ...(rangeInfo ? { range: rangeInfo } : {}),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  const language = toAppUiLanguage(session?.language);

  if (!session) {
    return okJson(
      { error: translateAbsenceText(language, "notLoggedIn") },
      { status: 401 }
    );
  }

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
    return okJson(
      { error: translateAbsenceText(language, "invalidData") },
      { status: 400 }
    );
  }

  const dayPortion: AbsenceDayPortion = isAbsenceDayPortion(dayPortionStr)
    ? dayPortionStr
    : AbsenceDayPortion.FULL_DAY;
  const compensation: AbsenceCompensation = isAbsenceCompensation(compensationStr)
    ? compensationStr
    : AbsenceCompensation.PAID;

  if (typeStr === "SICK" && dayPortion !== AbsenceDayPortion.FULL_DAY) {
    return okJson(
      { error: translateAbsenceText(language, "sickOnlyFullDayRecorded") },
      { status: 400 }
    );
  }

  if (typeStr === "SICK" && compensation !== AbsenceCompensation.PAID) {
    return okJson(
      { error: translateAbsenceText(language, "sickCannotBeUnpaidRecorded") },
      { status: 400 }
    );
  }

  if (
    dayPortion === AbsenceDayPortion.HALF_DAY &&
    typeStr !== "VACATION"
  ) {
    return okJson(
      { error: translateAbsenceText(language, "halfDaysOnlyForVacation") },
      { status: 400 }
    );
  }

  if (
    dayPortion === AbsenceDayPortion.HALF_DAY &&
    startDate !== endDate
  ) {
    return okJson(
      { error: translateAbsenceText(language, "halfVacationOnlySingleDateCreate") },
      { status: 400 }
    );
  }

  const start = dateOnlyUTC(startDate);
  const end = dateOnlyUTC(endDate);
  if (end < start) {
    return okJson(
      { error: translateAbsenceText(language, "endDateBeforeStartDate") },
      { status: 400 }
    );
  }

  if (start.getUTCFullYear() !== end.getUTCFullYear()) {
    return okJson(
      {
        error: translateAbsenceText(language, "crossYearAbsencesNotSupportedCreate"),
      },
      { status: 400 }
    );
  }

  const isAdmin = session.role === Role.ADMIN;
  let targetUserId = session.userId;

  if (isAdmin && userIdFromBody) {
    const targetUser = await findActiveCompanyUser(userIdFromBody, session.companyId);
    if (!targetUser) {
      return okJson(
        { error: translateAbsenceText(language, "employeeNotFoundOrInactive") },
        { status: 400 }
      );
    }
    targetUserId = targetUser.id;
  }

  if (!isAdmin) {
    return okJson(
      {
        error: translateAbsenceText(language, "employeesCannotCreateFinalAbsencesDirectly"),
      },
      { status: 403 }
    );
  }

  const days = buildEffectiveAbsenceDays(start, end, typeStr, dayPortion);

  if (typeStr === "VACATION" && days.length === 0) {
    return okJson(
      {
        error: translateAbsenceText(language, "noVacationWorkdaysInRange"),
      },
      { status: 400 }
    );
  }

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
  const language = toAppUiLanguage(session?.language);

  if (!session) {
    return okJson(
      { error: translateAbsenceText(language, "notLoggedIn") },
      { status: 401 }
    );
  }

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
  const oldPaidVacationUnitsRaw = getOptionalFiniteNumber(body.oldPaidVacationUnits);
  const oldUnpaidVacationUnitsRaw = getOptionalFiniteNumber(body.oldUnpaidVacationUnits);
  const newPaidVacationUnitsRaw = getOptionalFiniteNumber(body.newPaidVacationUnits);
  const newUnpaidVacationUnitsRaw = getOptionalFiniteNumber(body.newUnpaidVacationUnits);

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
    return okJson(
      { error: translateAbsenceText(language, "invalidData") },
      { status: 400 }
    );
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
      { error: translateAbsenceText(language, "sickOnlyFullDay") },
      { status: 400 }
    );
  }

  if (newTypeStr === "SICK" && newCompensation !== AbsenceCompensation.PAID) {
    return okJson(
      { error: translateAbsenceText(language, "sickCannotBeUnpaid") },
      { status: 400 }
    );
  }

  if (
    newDayPortion === AbsenceDayPortion.HALF_DAY &&
    newTypeStr !== "VACATION"
  ) {
    return okJson(
      { error: translateAbsenceText(language, "halfDaysOnlyForVacation") },
      { status: 400 }
    );
  }

  if (
    newDayPortion === AbsenceDayPortion.HALF_DAY &&
    newStartStr !== newEndStr
  ) {
    return okJson(
      { error: translateAbsenceText(language, "halfVacationOnlySingleDateEdit") },
      { status: 400 }
    );
  }

  const from = dateOnlyUTC(fromStr);
  const to = dateOnlyUTC(toStr);
  if (to < from) {
    return okJson(
      { error: translateAbsenceText(language, "toBeforeFrom") },
      { status: 400 }
    );
  }

  const newStart = dateOnlyUTC(newStartStr);
  const newEnd = dateOnlyUTC(newEndStr);
  if (newEnd < newStart) {
    return okJson(
      { error: translateAbsenceText(language, "newEndBeforeNewStart") },
      { status: 400 }
    );
  }

  if (newStart.getUTCFullYear() !== newEnd.getUTCFullYear()) {
    return okJson(
      {
        error: translateAbsenceText(language, "crossYearAbsencesNotSupportedEdit"),
      },
      { status: 400 }
    );
  }
  if (
    oldPaidVacationUnitsRaw !== null &&
    (!Number.isInteger(oldPaidVacationUnitsRaw) || oldPaidVacationUnitsRaw < 0)
  ) {
    return okJson(
      { error: translateAbsenceText(language, "oldPaidVacationUnitsInvalid") },
      { status: 400 }
    );
  }

  if (
    oldUnpaidVacationUnitsRaw !== null &&
    (!Number.isInteger(oldUnpaidVacationUnitsRaw) || oldUnpaidVacationUnitsRaw < 0)
  ) {
    return okJson(
      { error: translateAbsenceText(language, "oldUnpaidVacationUnitsInvalid") },
      { status: 400 }
    );
  }

  if (
    newPaidVacationUnitsRaw !== null &&
    (!Number.isInteger(newPaidVacationUnitsRaw) || newPaidVacationUnitsRaw < 0)
  ) {
    return okJson(
      { error: translateAbsenceText(language, "newPaidVacationUnitsInvalid") },
      { status: 400 }
    );
  }

  if (
    newUnpaidVacationUnitsRaw !== null &&
    (!Number.isInteger(newUnpaidVacationUnitsRaw) || newUnpaidVacationUnitsRaw < 0)
  ) {
    return okJson(
      { error: translateAbsenceText(language, "newUnpaidVacationUnitsInvalid") },
      { status: 400 }
    );
  }

  const isAdmin = session.role === Role.ADMIN;
  let targetUserId = session.userId;

  if (isAdmin && userIdFromBody) {
    const targetUser = await findActiveCompanyUser(userIdFromBody, session.companyId);
    if (!targetUser) {
      return okJson(
        { error: translateAbsenceText(language, "employeeNotFoundOrInactive") },
        { status: 400 }
      );
    }
    targetUserId = targetUser.id;
  }

  if (!isAdmin) {
    return okJson(
      { error: translateAbsenceText(language, "employeesCannotEditFinalAbsencesDirectly") },
      { status: 403 }
    );
  }

  const deleteFrom = from;
  const deleteToExclusive = new Date(to);
  deleteToExclusive.setUTCDate(deleteToExclusive.getUTCDate() + 1);

  const createDays = buildEffectiveAbsenceDays(
    newStart,
    newEnd,
    newTypeStr,
    newDayPortion
  );

  if (newTypeStr === "VACATION" && createDays.length === 0) {
    return okJson(
      {
        error: translateAbsenceText(language, "noVacationWorkdaysInRange"),
      },
      { status: 400 }
    );
  }

  const oldRequestedVacationUnits =
    typeStr === AbsenceType.VACATION
      ? getRequestedVacationUnits(from, to, oldDayPortion)
      : 0;

  const newRequestedVacationUnits =
    newTypeStr === AbsenceType.VACATION
      ? getRequestedVacationUnits(newStart, newEnd, newDayPortion)
      : 0;

  const oldPaidVacationUnits =
    oldPaidVacationUnitsRaw !== null || oldUnpaidVacationUnitsRaw !== null
      ? oldPaidVacationUnitsRaw ?? 0
      : typeStr === AbsenceType.VACATION && oldCompensation === AbsenceCompensation.PAID
        ? oldRequestedVacationUnits
        : 0;

  const oldUnpaidVacationUnits =
    oldPaidVacationUnitsRaw !== null || oldUnpaidVacationUnitsRaw !== null
      ? oldUnpaidVacationUnitsRaw ?? 0
      : typeStr === AbsenceType.VACATION && oldCompensation === AbsenceCompensation.UNPAID
        ? oldRequestedVacationUnits
        : 0;

  let newPaidVacationUnits =
    newPaidVacationUnitsRaw !== null || newUnpaidVacationUnitsRaw !== null
      ? newPaidVacationUnitsRaw ?? 0
      : 0;

  let newUnpaidVacationUnits =
    newPaidVacationUnitsRaw !== null || newUnpaidVacationUnitsRaw !== null
      ? newUnpaidVacationUnitsRaw ?? 0
      : 0;

  if (newTypeStr === AbsenceType.VACATION) {
    if (newPaidVacationUnitsRaw === null && newUnpaidVacationUnitsRaw === null) {
      newPaidVacationUnits =
        newCompensation === AbsenceCompensation.PAID ? newRequestedVacationUnits : 0;
      newUnpaidVacationUnits =
        newCompensation === AbsenceCompensation.UNPAID ? newRequestedVacationUnits : 0;
    }

    if (newPaidVacationUnits + newUnpaidVacationUnits !== newRequestedVacationUnits) {
      return okJson(
        {
          error: translateAbsenceText(language, "vacationUnitsSplitMismatch"),
        },
        { status: 400 }
      );
    }
  } else {
    newPaidVacationUnits = 0;
    newUnpaidVacationUnits = 0;
  }

  const tx = await prisma.$transaction(async (p) => {
    let deleted = 0;

    if (typeStr === AbsenceType.VACATION) {
      const oldDays = buildEffectiveAbsenceDays(from, to, typeStr, oldDayPortion);
      const oldRows = buildVacationAbsenceRowsWithSplit(
        targetUserId,
        oldDays,
        oldPaidVacationUnits,
        oldUnpaidVacationUnits
      );

      for (const row of oldRows) {
        const del = await p.absence.deleteMany({
          where: {
            userId: row.userId,
            type: row.type,
            dayPortion: row.dayPortion,
            compensation: row.compensation,
            absenceDate: row.absenceDate,
          },
        });
        deleted += del.count;
      }
    } else {
      const del = await p.absence.deleteMany({
        where: {
          userId: targetUserId,
          type: typeStr,
          dayPortion: oldDayPortion,
          compensation: oldCompensation,
          absenceDate: { gte: deleteFrom, lt: deleteToExclusive },
        },
      });
      deleted = del.count;
    }

    const newRows =
      newTypeStr === AbsenceType.VACATION
        ? buildVacationAbsenceRowsWithSplit(
            targetUserId,
            createDays,
            newPaidVacationUnits,
            newUnpaidVacationUnits
          )
        : createDays.map((d) => ({
            userId: targetUserId,
            absenceDate: d,
            type: newTypeStr,
            dayPortion: newDayPortion,
            compensation: newCompensation,
          }));

    const created = await p.absence.createMany({
      data: newRows,
      skipDuplicates: true,
    });

    return {
      deleted,
      created: created.count,
      requested: newRows.length,
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
      paidVacationUnits: oldPaidVacationUnits,
      unpaidVacationUnits: oldUnpaidVacationUnits,
    },
    next: {
      from: newStartStr,
      to: newEndStr,
      type: newTypeStr,
      dayPortion: newDayPortion,
      compensation: newCompensation,
      paidVacationUnits: newPaidVacationUnits,
      unpaidVacationUnits: newUnpaidVacationUnits,
    },
    deleted: tx.deleted,
    created: tx.created,
    requested: tx.requested,
    skipped: tx.requested - tx.created,
  });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  const language = toAppUiLanguage(session?.language);

  if (!session) {
    return okJson(
      { error: translateAbsenceText(language, "notLoggedIn") },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const id = (url.searchParams.get("id") ?? "").trim();

  if (id) {
    const a = await prisma.absence.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            companyId: true,
          },
        },
      },
    });
    if (!a) {
      return okJson(
        { error: translateAbsenceText(language, "notFound") },
        { status: 404 }
      );
    }

    if (a.user.companyId !== session.companyId) {
      return okJson(
        { error: translateAbsenceText(language, "notAllowed") },
        { status: 403 }
      );
    }

    const isAdmin = session.role === Role.ADMIN;
    if (!isAdmin) {
      return okJson(
        { error: translateAbsenceText(language, "employeesCannotDeleteFinalAbsencesDirectly") },
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
      { error: translateAbsenceText(language, "idOrRangeRequired") },
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
    return okJson(
      { error: translateAbsenceText(language, "toBeforeFrom") },
      { status: 400 }
    );
  }

  const isAdmin = session.role === Role.ADMIN;
  if (!isAdmin) {
    return okJson(
      { error: translateAbsenceText(language, "employeesCannotDeleteFinalAbsencesDirectly") },
      { status: 403 }
    );
  }

  const requestedUserId = (url.searchParams.get("userId") ?? "").trim();
  let targetUserId = session.userId;

  if (requestedUserId) {
    const targetUser = await findActiveCompanyUser(requestedUserId, session.companyId);
    if (!targetUser) {
      return okJson(
        { error: translateAbsenceText(language, "employeeNotFoundOrInactive") },
        { status: 400 }
      );
    }
    targetUserId = targetUser.id;
  }

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