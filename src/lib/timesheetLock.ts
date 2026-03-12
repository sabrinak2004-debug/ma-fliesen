// src/lib/timesheetLock.ts

import Holidays from "date-holidays";
import { prisma } from "@/lib/prisma";

function parseIsoDateToUtc(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

function isoDayUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addUtcDays(d: Date, days: number): Date {
  const copy = new Date(d.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function isWeekdayUtcDate(d: Date): boolean {
  const weekday = d.getUTCDay();
  return weekday >= 1 && weekday <= 5;
}

function getHolidaySetForYears(startYear: number, endYear: number): Set<string> {
  const hd = new Holidays("DE", "BW");
  const result = new Set<string>();

  for (let year = startYear; year <= endYear; year += 1) {
    const holidays = hd.getHolidays(year);
    for (const holiday of holidays) {
      result.add(holiday.date.slice(0, 10));
    }
  }

  return result;
}

function countBusinessDaysBetweenExclusiveStartAndInclusiveEnd(
  startYMD: string,
  endYMD: string
): number {
  if (startYMD >= endYMD) {
    return 0;
  }

  const startDate = parseIsoDateToUtc(startYMD);
  const endDate = parseIsoDateToUtc(endYMD);

  const holidaySet = getHolidaySetForYears(
    startDate.getUTCFullYear(),
    endDate.getUTCFullYear()
  );

  let count = 0;

  for (
    let current = addUtcDays(startDate, 1);
    current <= endDate;
    current = addUtcDays(current, 1)
  ) {
    const currentYMD = isoDayUTC(current);

    if (!isWeekdayUtcDate(current)) continue;
    if (holidaySet.has(currentYMD)) continue;

    count += 1;
  }

  return count;
}

  export function requiresTimeEntryUnlock(
    workDateYMD: string,
    todayYMD: string,
    graceBusinessDays: number = 5
  ): boolean {
    if (workDateYMD >= todayYMD) {
      return false;
    }

    const elapsedBusinessDays =
      countBusinessDaysBetweenExclusiveStartAndInclusiveEnd(
        workDateYMD,
        todayYMD
      );

    return elapsedBusinessDays > graceBusinessDays;
  }

export function berlinTodayYMD(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const d = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${y}-${m}-${d}`;
}

export function berlinHour(now: Date = new Date()): number {
  const hourText = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    hour12: false,
  }).format(now);

  const hour = Number(hourText);
  return Number.isFinite(hour) ? hour : 0;
}

export async function getMissingRequiredWorkDates(
  userId: string,
  untilDateYMD: string
): Promise<string[]> {
  const untilDate = parseIsoDateToUtc(untilDateYMD);

  const user = await prisma.appUser.findUnique({
    where: { id: userId },
    select: { createdAt: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return [];
  }

  const createdDateYMD = isoDayUTC(user.createdAt);
  const createdDate = parseIsoDateToUtc(createdDateYMD);

  if (createdDate >= untilDate) {
    return [];
  }

  const rangeEndExclusive = untilDate;

  const [entries, absences] = await prisma.$transaction([
    prisma.workEntry.findMany({
      where: {
        userId,
        workDate: {
          gte: createdDate,
          lt: rangeEndExclusive,
        },
      },
      select: {
        workDate: true,
      },
    }),
    prisma.absence.findMany({
      where: {
        userId,
        absenceDate: {
          gte: createdDate,
          lt: rangeEndExclusive,
        },
      },
      select: {
        absenceDate: true,
      },
    }),
  ]);

  const entryDateSet = new Set<string>(
    entries.map((entry) => isoDayUTC(entry.workDate))
  );

  const absenceDateSet = new Set<string>(
    absences.map((absence) => isoDayUTC(absence.absenceDate))
  );

  const holidaySet = getHolidaySetForYears(
    createdDate.getUTCFullYear(),
    untilDate.getUTCFullYear()
  );

  const missingDates: string[] = [];

  for (
    let current = new Date(createdDate.getTime());
    current < rangeEndExclusive;
    current = addUtcDays(current, 1)
  ) {
    const currentYMD = isoDayUTC(current);

    if (!isWeekdayUtcDate(current)) continue;
    if (holidaySet.has(currentYMD)) continue;
    if (absenceDateSet.has(currentYMD)) continue;
    if (entryDateSet.has(currentYMD)) continue;

    missingDates.push(currentYMD);
  }

  return missingDates;
}

export async function hasActiveTimeEntryUnlock(
  userId: string,
  workDateYMD: string,
  now: Date = new Date()
): Promise<boolean> {
  const unlock = await prisma.timeEntryUnlock.findUnique({
    where: {
      userId_workDate: {
        userId,
        workDate: parseIsoDateToUtc(workDateYMD),
      },
    },
    select: {
      id: true,
      expiresAt: true,
      usedAt: true,
    },
  });

  if (!unlock) {
    return false;
  }

  if (unlock.usedAt) {
    return false;
  }

  if (unlock.expiresAt && unlock.expiresAt.getTime() < now.getTime()) {
    return false;
  }

  return true;
}

export async function consumeTimeEntryUnlock(
  userId: string,
  workDateYMD: string
): Promise<void> {
  const unlock = await prisma.timeEntryUnlock.findUnique({
    where: {
      userId_workDate: {
        userId,
        workDate: parseIsoDateToUtc(workDateYMD),
      },
    },
    select: {
      id: true,
      usedAt: true,
    },
  });

  if (!unlock || unlock.usedAt) {
    return;
  }

  await prisma.timeEntryUnlock.update({
    where: { id: unlock.id },
    data: {
      usedAt: new Date(),
    },
  });
}

export async function assertEmployeeMayEditDate(args: {
  role: "ADMIN" | "EMPLOYEE";
  userId: string;
  workDateYMD: string;
  now?: Date;
}): Promise<void> {
  if (args.role === "ADMIN") {
    return;
  }

  const now = args.now ?? new Date();
  const today = berlinTodayYMD(now);

  if (args.workDateYMD > today) {
    throw new Error("Du kannst keine Einträge für zukünftige Tage bearbeiten.");
  }

  const missingBeforeTarget = await getMissingRequiredWorkDates(
    args.userId,
    args.workDateYMD
  );

  if (missingBeforeTarget.length > 0) {
    throw new Error(
      `Dir fehlen noch Arbeitseinträge ab dem ${missingBeforeTarget[0]}. Bitte trage zuerst die ältesten fehlenden Tage nach.`
    );
  }

  if (args.workDateYMD === today) {
    return;
  }

  if (!requiresTimeEntryUnlock(args.workDateYMD, today)) {
    return;
  }

  const hasUnlock = await hasActiveTimeEntryUnlock(
    args.userId,
    args.workDateYMD,
    now
  );

  if (!hasUnlock) {
    throw new Error(
      "Dieser vergangene Tag ist gesperrt. Bitte stelle einen Nachtragsantrag, damit der Admin ihn freigeben kann."
    );
  }
}