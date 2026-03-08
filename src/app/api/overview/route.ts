import { NextResponse } from "next/server";
import { AbsenceDayPortion, Role } from "@prisma/client";
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

function absencePortionValue(dayPortion: AbsenceDayPortion): number {
  return dayPortion === AbsenceDayPortion.HALF_DAY ? 0.5 : 1;
}

const ANNUAL_VACATION_DAYS = 30;
const DAILY_TARGET_MINUTES = 8 * 60;

function toIsoDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function createUTCDate(year: number, monthIndexZeroBased: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndexZeroBased, day));
}

function isWeekdayMondayToFridayUTC(d: Date): boolean {
  const day = d.getUTCDay();
  return day >= 1 && day <= 5;
}

function easterSundayUTC(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return createUTCDate(year, month - 1, day);
}

function addDaysUTC(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function getBadenWuerttembergHolidaySet(year: number): Set<string> {
  const easter = easterSundayUTC(year);

  const fixedDates: Date[] = [
    createUTCDate(year, 0, 1),   // Neujahr
    createUTCDate(year, 0, 6),   // Heilige Drei Könige
    createUTCDate(year, 4, 1),   // Tag der Arbeit
    createUTCDate(year, 9, 3),   // Tag der Deutschen Einheit
    createUTCDate(year, 10, 1),  // Allerheiligen
    createUTCDate(year, 11, 25), // 1. Weihnachtstag
    createUTCDate(year, 11, 26), // 2. Weihnachtstag
  ];

  const movableDates: Date[] = [
    addDaysUTC(easter, -2),  // Karfreitag
    addDaysUTC(easter, 1),   // Ostermontag
    addDaysUTC(easter, 39),  // Christi Himmelfahrt
    addDaysUTC(easter, 50),  // Pfingstmontag
    addDaysUTC(easter, 60),  // Fronleichnam
  ];

  return new Set(
    [...fixedDates, ...movableDates].map((date) => toIsoDateUTC(date))
  );
}

function countWorkingDaysInMonthExcludingHolidays(
  year: number,
  monthOneBased: number,
  holidaySet: Set<string>
): number {
  let count = 0;
  const firstDay = createUTCDate(year, monthOneBased - 1, 1);
  const nextMonth = createUTCDate(year, monthOneBased, 1);

  for (
    let current = new Date(firstDay.getTime());
    current < nextMonth;
    current = addDaysUTC(current, 1)
  ) {
    if (!isWeekdayMondayToFridayUTC(current)) continue;
    if (holidaySet.has(toIsoDateUTC(current))) continue;
    count += 1;
  }

  return count;
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

  const [y, m] = month.split("-").map(Number);

  const from = new Date(Date.UTC(y, m - 1, 1));
  const to = new Date(Date.UTC(y, m, 1));

  const yearFrom = new Date(Date.UTC(y, 0, 1));
  const yearTo = new Date(Date.UTC(y, m, 1)); // exklusiv => bis Ende des gefilterten Monats

  const holidaySet = getBadenWuerttembergHolidaySet(y);
  const baseWorkingDays = countWorkingDaysInMonthExcludingHolidays(y, m, holidaySet);
  const baseTargetMinutes = baseWorkingDays * DAILY_TARGET_MINUTES;

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
      type: "VACATION",
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
    const userYearVacationAbsences = yearVacationAbsences.filter((absence) => absence.userId === user.id);

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

    const usedVacationDaysYtd = userYearVacationAbsences.reduce(
      (sum, row) => sum + absencePortionValue(row.dayPortion),
      0
    );

    const remainingVacationDays = Math.max(0, ANNUAL_VACATION_DAYS - usedVacationDaysYtd);

    const absenceReductionMinutes = userAbsences.reduce((sum, row) => {
      const dayIso = isoDayUTC(row.absenceDate);
      const date = new Date(`${dayIso}T00:00:00.000Z`);

      if (!isWeekdayMondayToFridayUTC(date)) return sum;
      if (holidaySet.has(dayIso)) return sum;

      return sum + absencePortionValue(row.dayPortion) * DAILY_TARGET_MINUTES;
    }, 0);

    const targetMinutes = Math.max(0, baseTargetMinutes - absenceReductionMinutes);

    return {
      fullName: user.fullName,
      role: user.role,
      entriesCount: userEntries.length,
      workMinutes: netMinutesSum,
      travelMinutes: userEntries.reduce((sum, row) => sum + (row.travelMinutes ?? 0), 0),
      vacationDays: userAbsences
        .filter((row) => row.type === "VACATION")
        .reduce((sum, row) => sum + absencePortionValue(row.dayPortion), 0),
      sickDays: userAbsences
        .filter((row) => row.type === "SICK")
        .reduce((sum, row) => sum + absencePortionValue(row.dayPortion), 0),
      usedVacationDaysYtd,
      remainingVacationDays,
      baseTargetMinutes,
      targetMinutes,
      holidayCountInMonth: Array.from(holidaySet.values()).filter((dayIso) => {
        return dayIso.startsWith(`${month}-`);
      }).length,
    };
  });

  return NextResponse.json({
    month,
    annualVacationDays: ANNUAL_VACATION_DAYS,
    dailyTargetMinutes: DAILY_TARGET_MINUTES,
    workingDaysInMonth: baseWorkingDays,
    byUser,
    totals: {
      entriesCount: entries.length,
      workMinutes: byUser.reduce((sum, user) => sum + user.workMinutes, 0),
      travelMinutes: byUser.reduce((sum, user) => sum + user.travelMinutes, 0),
      vacationDays: byUser.reduce((sum, user) => sum + user.vacationDays, 0),
      sickDays: byUser.reduce((sum, user) => sum + user.sickDays, 0),
      usedVacationDaysYtd: byUser.reduce((sum, user) => sum + user.usedVacationDaysYtd, 0),
      remainingVacationDays: byUser.reduce((sum, user) => sum + user.remainingVacationDays, 0),
      baseTargetMinutes: byUser.reduce((sum, user) => sum + user.baseTargetMinutes, 0),
      targetMinutes: byUser.reduce((sum, user) => sum + user.targetMinutes, 0),
    },
    isAdmin,
  });
}