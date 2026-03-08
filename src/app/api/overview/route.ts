import { NextResponse } from "next/server";
import { AbsenceDayPortion, AbsenceType, Role } from "@prisma/client";
import Holidays from "date-holidays";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { computeDayBreakFromGross } from "@/lib/breaks";

function isoDayUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type DayAgg = {
  gross: number;
  manualBreak: number;
};

const ANNUAL_VACATION_DAYS = 30;
const DAILY_TARGET_MINUTES = 8 * 60;

function absencePortionValue(dayPortion: AbsenceDayPortion): number {
  return dayPortion === AbsenceDayPortion.HALF_DAY ? 0.5 : 1;
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
      .map((holiday) => holiday.date.slice(0, 10))
      .filter((iso) => iso.startsWith(`${month}-`))
  );
}

export async function GET(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const isAdmin = session.role === Role.ADMIN;

  const url = new URL(req.url);
  const month = url.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month Format muss YYYY-MM sein" }, { status: 400 });
  }

  const [year, monthNumber] = month.split("-").map(Number);

  const from = buildMonthStartUtc(year, monthNumber);
  const to = buildNextMonthStartUtc(year, monthNumber);

  const yearFrom = new Date(Date.UTC(year, 0, 1));
  const yearTo = buildNextMonthStartUtc(year, monthNumber);

  const holidaySet = getHolidaySetForMonth(year, month);
  const workingDaysInMonth = countWorkingDaysWithoutHolidays(year, monthNumber, holidaySet);
  const baseTargetMinutes = workingDaysInMonth * DAILY_TARGET_MINUTES;

  const users = await prisma.appUser.findMany({
    where: isAdmin ? { isActive: true } : { id: session.userId, isActive: true },
    orderBy: { fullName: "asc" },
  });

  const entries = await prisma.workEntry.findMany({
    where: {
      ...(isAdmin ? {} : { userId: session.userId }),
      workDate: { gte: from, lt: to },
    },
  });

  const dayBreaks = await prisma.dayBreak.findMany({
    where: {
      ...(isAdmin ? {} : { userId: session.userId }),
      workDate: { gte: from, lt: to },
    },
  });

  const absences = await prisma.absence.findMany({
    where: {
      ...(isAdmin ? {} : { userId: session.userId }),
      absenceDate: { gte: from, lt: to },
    },
  });

  const yearVacationAbsences = await prisma.absence.findMany({
    where: {
      ...(isAdmin ? {} : { userId: session.userId }),
      type: AbsenceType.VACATION,
      absenceDate: { gte: yearFrom, lt: yearTo },
    },
  });

  const dayBreakMap = new Map<string, number>();

  for (const row of dayBreaks) {
    const key = `${row.userId}|${isoDayUTC(row.workDate)}`;
    dayBreakMap.set(key, row.manualMinutes);
  }

  const byUser = users.map((user) => {
    const userEntries = entries.filter((entry) => entry.userId === user.id);
    const userAbsences = absences.filter((absence) => absence.userId === user.id);
    const userYearVacationAbsences = yearVacationAbsences.filter(
      (absence) => absence.userId === user.id
    );

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

    const vacationDays = userAbsences
      .filter((row) => row.type === AbsenceType.VACATION)
      .reduce((sum, row) => sum + absencePortionValue(row.dayPortion), 0);

    const sickDays = userAbsences
      .filter((row) => row.type === AbsenceType.SICK)
      .reduce((sum, row) => sum + absencePortionValue(row.dayPortion), 0);

    const usedVacationDaysYtd = userYearVacationAbsences.reduce(
      (sum, row) => sum + absencePortionValue(row.dayPortion),
      0
    );

    const remainingVacationDays = Math.max(
      0,
      ANNUAL_VACATION_DAYS - usedVacationDaysYtd
    );

    const absenceReductionMinutes = userAbsences.reduce((sum, row) => {
      const iso = isoDayUTC(row.absenceDate);
      const date = new Date(`${iso}T00:00:00.000Z`);

      if (!isWeekdayUtcDate(date)) return sum;
      if (holidaySet.has(iso)) return sum;

      return sum + absencePortionValue(row.dayPortion) * DAILY_TARGET_MINUTES;
    }, 0);

    const targetMinutes = Math.max(0, baseTargetMinutes - absenceReductionMinutes);

    return {
      userId: user.id,
      fullName: user.fullName,
      role: user.role,
      entriesCount: userEntries.length,
      workMinutes: netMinutesSum,
      travelMinutes: userEntries.reduce(
        (sum, row) => sum + Number(row.travelMinutes ?? 0),
        0
      ),
      vacationDays,
      sickDays,
      usedVacationDaysYtd,
      remainingVacationDays,
      baseTargetMinutes,
      targetMinutes,
      holidayCountInMonth: holidaySet.size,
      workingDaysInMonth,
    };
  });

  return NextResponse.json({
    month,
    annualVacationDays: ANNUAL_VACATION_DAYS,
    dailyTargetMinutes: DAILY_TARGET_MINUTES,
    workingDaysInMonth,
    holidayCountInMonth: holidaySet.size,
    isAdmin,
    byUser,
    totals: {
      entriesCount: entries.length,
      workMinutes: byUser.reduce((sum, user) => sum + user.workMinutes, 0),
      travelMinutes: byUser.reduce((sum, user) => sum + user.travelMinutes, 0),
      vacationDays: byUser.reduce((sum, user) => sum + user.vacationDays, 0),
      sickDays: byUser.reduce((sum, user) => sum + user.sickDays, 0),
      usedVacationDaysYtd: byUser.reduce(
        (sum, user) => sum + user.usedVacationDaysYtd,
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
    },
  });
}