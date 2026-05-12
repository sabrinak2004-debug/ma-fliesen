import { NextResponse } from "next/server";
import {
  AbsenceCompensation,
  AbsenceDayPortion,
  AbsenceTimeMode,
  AbsenceType,
  Role,
} from "@prisma/client";
import Holidays from "date-holidays";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { computeDayBreakFromGross } from "@/lib/breaks";
import { berlinTodayYMD, getMissingRequiredWorkDates } from "@/lib/timesheetLock";
import { rebalanceAutoUnpaidVacationRequestsForYear } from "@/app/api/absence-requests/route";

function isoDayUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type DayAgg = {
  gross: number;
  manualBreak: number;
};

const ANNUAL_VACATION_DAYS = 30;
const DAILY_TARGET_MINUTES = 8 * 60;

const MONTHLY_VACATION_ACCRUAL_DAYS = ANNUAL_VACATION_DAYS / 12;

function getAccruedVacationDaysUntilMonth(monthOneBased: number): number {
  return Math.min(
    ANNUAL_VACATION_DAYS,
    monthOneBased * MONTHLY_VACATION_ACCRUAL_DAYS
  );
}

function absencePortionValue(dayPortion: AbsenceDayPortion): number {
  return dayPortion === AbsenceDayPortion.HALF_DAY ? 0.5 : 1;
}

function absencePortionMinutes(dayPortion: AbsenceDayPortion): number {
  return absencePortionValue(dayPortion) * DAILY_TARGET_MINUTES;
}

function paidAbsenceMinutes(row: {
  dayPortion: AbsenceDayPortion;
  timeMode: AbsenceTimeMode;
  paidMinutes: number;
}): number {
  if (row.timeMode === AbsenceTimeMode.TIME_RANGE) {
    return Math.max(0, row.paidMinutes);
  }

  return absencePortionMinutes(row.dayPortion);
}

function paidAbsenceDayValue(row: {
  dayPortion: AbsenceDayPortion;
  timeMode: AbsenceTimeMode;
  paidMinutes: number;
}): number {
  if (row.timeMode === AbsenceTimeMode.TIME_RANGE) {
    return paidAbsenceMinutes(row) / DAILY_TARGET_MINUTES;
  }

  return absencePortionValue(row.dayPortion);
}

function isWeekdayUtcDate(d: Date): boolean {
  const day = d.getUTCDay();
  return day >= 1 && day <= 5;
}

function buildMonthStartUtc(year: number, monthOneBased: number): Date {
  return new Date(Date.UTC(year, monthOneBased - 1, 1));
}

function buildNextMonthStartUtc(year: number, monthOneBased: number): Date {
  return new Date(Date.UTC(year, monthOneBased, 1));
}

function addUtcDays(d: Date, days: number): Date {
  const copy = new Date(d.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function countHolidayWeekdays(holidaySet: Set<string>): number {
  let count = 0;

  for (const iso of holidaySet) {
    const [year, month, day] = iso.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (isWeekdayUtcDate(date)) {
      count += 1;
    }
  }

  return count;
}

function countWorkingDaysWithoutHolidays(
  year: number,
  monthOneBased: number,
  holidaySet: Set<string>
): number {
  const from = buildMonthStartUtc(year, monthOneBased);
  const to = buildNextMonthStartUtc(year, monthOneBased);

  let count = 0;

  for (let current = new Date(from.getTime()); current < to; current = addUtcDays(current, 1)) {
    const iso = isoDayUTC(current);

    if (!isWeekdayUtcDate(current)) continue;
    if (holidaySet.has(iso)) continue;

    count += 1;
  }

  return count;
}

function getHolidaySetForMonth(year: number, month: string): Set<string> {
  const hd = new Holidays("DE", "BW");
  const holidays = hd.getHolidays(year);

  return new Set(
    holidays
      .filter((holiday) => holiday.type === "public")
      .map((holiday) => holiday.date.slice(0, 10))
      .filter((iso) => iso.startsWith(`${month}-`))
  );
}

export async function GET(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "OVERVIEW_NOT_AUTHENTICATED" }, { status: 401 });
  }

  const isAdmin = session.role === Role.ADMIN;

  const url = new URL(req.url);
  const month = url.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "OVERVIEW_MONTH_INVALID_FORMAT" }, { status: 400 });
  }

  const [year, monthNumber] = month.split("-").map(Number);

  const from = buildMonthStartUtc(year, monthNumber);
  const to = buildNextMonthStartUtc(year, monthNumber);

  const yearFrom = new Date(Date.UTC(year, 0, 1));
  const selectedMonthEnd = new Date(to.getTime() - 1);

  const holidaySet = getHolidaySetForMonth(year, month);
  const workingDaysInMonth = countWorkingDaysWithoutHolidays(year, monthNumber, holidaySet);
  const baseTargetMinutes = workingDaysInMonth * DAILY_TARGET_MINUTES;

  const users = await prisma.appUser.findMany({
    where: isAdmin
      ? {
          companyId: session.companyId,
          isActive: true,
          role: Role.EMPLOYEE,
        }
      : {
          id: session.userId,
          isActive: true,
        },
    orderBy: { fullName: "asc" },
  });

  for (const user of users) {
    await rebalanceAutoUnpaidVacationRequestsForYear(
      user.id,
      year,
      selectedMonthEnd
    );
  }

  const entries = await prisma.workEntry.findMany({
    where: {
      ...(isAdmin
        ? {
            user: {
              companyId: session.companyId,
              role: Role.EMPLOYEE,
              isActive: true,
            },
          }
        : { userId: session.userId }),
      workDate: { gte: from, lt: to },
    },
  });

  const dayBreaks = await prisma.dayBreak.findMany({
    where: {
      ...(isAdmin
        ? {
            user: {
              companyId: session.companyId,
              role: Role.EMPLOYEE,
              isActive: true,
            },
          }
        : { userId: session.userId }),
      workDate: { gte: from, lt: to },
    },
  });

  const absences = await prisma.absence.findMany({
    where: {
      ...(isAdmin
        ? {
            user: {
              companyId: session.companyId,
              role: Role.EMPLOYEE,
              isActive: true,
            },
          }
        : { userId: session.userId }),
      absenceDate: { gte: from, lt: to },
    },
  });

  const yearVacationRequests = await prisma.absenceRequest.findMany({
    where: {
      ...(isAdmin
        ? {
            user: {
              companyId: session.companyId,
              role: Role.EMPLOYEE,
              isActive: true,
            },
          }
        : { userId: session.userId }),
      type: AbsenceType.VACATION,
      status: {
        in: ["PENDING", "APPROVED"],
      },
      createdAt: {
        gte: yearFrom,
        lte: selectedMonthEnd,
      },
    },
    select: {
      userId: true,
      paidVacationUnits: true,
    },
  });

  const dayBreakMap = new Map<string, number>();

  for (const row of dayBreaks) {
    const key = `${row.userId}|${isoDayUTC(row.workDate)}`;
    dayBreakMap.set(key, row.manualMinutes);
  }

  const byUser = await Promise.all(users.map(async (user) => {
    const userEntries = entries.filter((entry) => entry.userId === user.id);
    const userAbsences = absences.filter((absence) => absence.userId === user.id);

    const dayMap = new Map<string, DayAgg>();

    for (const row of userEntries) {
      const dayKey = isoDayUTC(row.workDate);
      const current = dayMap.get(dayKey) ?? { gross: 0, manualBreak: 0 };

      current.gross += Math.max(0, row.grossMinutes ?? 0);
      dayMap.set(dayKey, current);
    }

    for (const [dayKey, current] of dayMap.entries()) {
      const manual = dayBreakMap.get(`${user.id}|${dayKey}`) ?? 0;
      current.manualBreak = manual;
      dayMap.set(dayKey, current);
    }

    let netMinutesSum = 0;

    for (const value of dayMap.values()) {
      const result = computeDayBreakFromGross(value.gross, value.manualBreak);
      netMinutesSum += result.netDayMinutes;
    }

    const paidVacationAbsences = userAbsences.filter(
      (row) => row.type === AbsenceType.VACATION && row.compensation === AbsenceCompensation.PAID
    );

    const unpaidVacationAbsences = userAbsences.filter(
      (row) => row.type === AbsenceType.VACATION && row.compensation === AbsenceCompensation.UNPAID
    );

    const paidSickAbsences = userAbsences.filter(
      (row) => row.type === AbsenceType.SICK && row.compensation === AbsenceCompensation.PAID
    );

    const vacationDays = paidVacationAbsences.reduce(
      (sum, row) => sum + absencePortionValue(row.dayPortion),
      0
    );

    const sickDays = paidSickAbsences.reduce(
      (sum, row) => sum + paidAbsenceDayValue(row),
      0
    );

    const vacationMinutes = paidVacationAbsences.reduce(
      (sum, row) => sum + absencePortionMinutes(row.dayPortion),
      0
    );

    const sickMinutes = paidSickAbsences.reduce(
      (sum, row) => sum + paidAbsenceMinutes(row),
      0
    );

    const unpaidAbsenceDays = unpaidVacationAbsences.reduce(
      (sum, row) => sum + absencePortionValue(row.dayPortion),
      0
    );

    const unpaidAbsenceMinutes = unpaidVacationAbsences.reduce(
      (sum, row) => sum + absencePortionMinutes(row.dayPortion),
      0
    );

    const accruedVacationDays = getAccruedVacationDaysUntilMonth(monthNumber);

    const reservedPaidVacationDays = yearVacationRequests
      .filter((row) => row.userId === user.id)
      .reduce((sum, row) => sum + row.paidVacationUnits / 2, 0);

    const usedVacationDaysYtd = reservedPaidVacationDays;

    const remainingVacationDays = Math.max(
      0,
      accruedVacationDays - reservedPaidVacationDays
    );

    const paidHolidayMinutes = countHolidayWeekdays(holidaySet) * DAILY_TARGET_MINUTES;

    const targetMinutes = baseTargetMinutes;
    const netTargetMinutes = Math.max(
      0,
      baseTargetMinutes - vacationMinutes - sickMinutes - paidHolidayMinutes
    );

    const missingRequiredWorkDates = await getMissingRequiredWorkDates(
      user.id,
      berlinTodayYMD(),
      {
        companyId: session.companyId,
      }
    );

    const oldestMissingRequiredWorkDate =
      missingRequiredWorkDates.length > 0 ? missingRequiredWorkDates[0] : null;
    return {
      userId: user.id,
      fullName: user.fullName,
      role: user.role,
      missingRequiredWorkDatesCount: missingRequiredWorkDates.length,
      oldestMissingRequiredWorkDate,
      entriesCount: userEntries.length,
      workMinutes: netMinutesSum,
      travelMinutes: userEntries.reduce(
        (sum, row) => sum + Number(row.travelMinutes ?? 0),
        0
      ),
      vacationDays,
      sickDays,
      vacationMinutes,
      sickMinutes,
      unpaidAbsenceDays,
      unpaidAbsenceMinutes,
      accruedVacationDays,
      usedVacationDaysYtd,
      reservedPaidVacationDays,
      remainingVacationDays,
      baseTargetMinutes,
      targetMinutes,
      netTargetMinutes,
      holidayCountInMonth: countHolidayWeekdays(holidaySet),
      holidayMinutes: paidHolidayMinutes,
      workingDaysInMonth,
    };
  }));

  return NextResponse.json({
    month,
    annualVacationDays: ANNUAL_VACATION_DAYS,
    dailyTargetMinutes: DAILY_TARGET_MINUTES,
    workingDaysInMonth,
    holidayCountInMonth: countHolidayWeekdays(holidaySet),
    isAdmin,
    byUser,
    totals: {
      entriesCount: entries.length,
      workMinutes: byUser.reduce((sum, user) => sum + user.workMinutes, 0),
      travelMinutes: byUser.reduce((sum, user) => sum + user.travelMinutes, 0),
      vacationDays: byUser.reduce((sum, user) => sum + user.vacationDays, 0),
      sickDays: byUser.reduce((sum, user) => sum + user.sickDays, 0),
      vacationMinutes: byUser.reduce((sum, user) => sum + user.vacationMinutes, 0),
      sickMinutes: byUser.reduce((sum, user) => sum + user.sickMinutes, 0),
      unpaidAbsenceDays: byUser.reduce((sum, user) => sum + user.unpaidAbsenceDays, 0),
      unpaidAbsenceMinutes: byUser.reduce((sum, user) => sum + user.unpaidAbsenceMinutes, 0),
      accruedVacationDays: byUser.reduce(
        (sum, user) => sum + user.accruedVacationDays,
        0
      ),
      usedVacationDaysYtd: byUser.reduce(
        (sum, user) => sum + user.usedVacationDaysYtd,
        0
      ),
      reservedPaidVacationDays: byUser.reduce(
        (sum, user) => sum + user.reservedPaidVacationDays,
        0
      ),
      remainingVacationDays: byUser.reduce(
        (sum, user) => sum + user.remainingVacationDays,
        0
      ),
      baseTargetMinutes: byUser.reduce(
        (sum, user) => sum + user.baseTargetMinutes,
        0
      ),
      targetMinutes: byUser.reduce((sum, user) => sum + user.targetMinutes, 0),
      netTargetMinutes: byUser.reduce((sum, user) => sum + user.netTargetMinutes, 0),
      holidayMinutes: byUser.reduce((sum, user) => sum + user.holidayMinutes, 0),
    },
  });
}