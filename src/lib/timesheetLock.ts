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

type MissingEntriesRule = {
  activationStartYMD: string;
  useFirstBusinessDayOfMonth: boolean;
  overridesByNormalizedFullName?: Readonly<Record<string, string>>;
};

const DEFAULT_MISSING_ENTRIES_RULE: MissingEntriesRule = {
  activationStartYMD: "2026-04-01",
  useFirstBusinessDayOfMonth: true,
};

const MISSING_ENTRIES_RULES_BY_COMPANY_SUBDOMAIN: Readonly<
  Record<string, MissingEntriesRule>
> = {
  "ma-fliesen": {
    activationStartYMD: "2026-05-01",
    useFirstBusinessDayOfMonth: true,
    overridesByNormalizedFullName: {
      "max mustermann": "2026-03-01",
    },
  },
  demo: {
    activationStartYMD: "2026-05-01",
    useFirstBusinessDayOfMonth: false,
  },
};

function normalizeFullName(fullName: string): string {
  return fullName.trim().replace(/\s+/g, " ").toLocaleLowerCase("de-DE");
}

function normalizeCompanySubdomain(companySubdomain: string | undefined): string {
  return (companySubdomain ?? "").trim().toLocaleLowerCase("de-DE");
}

function maxYmd(a: string, b: string): string {
  return a >= b ? a : b;
}

function getMissingEntriesRule(companySubdomain?: string): MissingEntriesRule {
  return (
    MISSING_ENTRIES_RULES_BY_COMPANY_SUBDOMAIN[
      normalizeCompanySubdomain(companySubdomain)
    ] ?? DEFAULT_MISSING_ENTRIES_RULE
  );
}

function getMissingEntriesActivationStartYMD(
  fullName: string,
  companySubdomain?: string
): string {
  const rule = getMissingEntriesRule(companySubdomain);
  const normalizedFullName = normalizeFullName(fullName);

  return (
    rule.overridesByNormalizedFullName?.[normalizedFullName] ??
    rule.activationStartYMD
  );
}

function getFirstBusinessDayOfMonthYMD(
  year: number,
  monthOneBased: number,
  holidaySet: Set<string>
): string {
  const monthStart = new Date(Date.UTC(year, monthOneBased - 1, 1));
  const nextMonthStart = new Date(Date.UTC(year, monthOneBased, 1));

  for (
    let current = new Date(monthStart.getTime());
    current < nextMonthStart;
    current = addUtcDays(current, 1)
  ) {
    const currentYMD = isoDayUTC(current);

    if (!isWeekdayUtcDate(current)) continue;
    if (holidaySet.has(currentYMD)) continue;

    return currentYMD;
  }

  return isoDayUTC(monthStart);
}

function getEffectiveMissingEntriesStartForDay(
  currentYMD: string,
  activationStartYMD: string,
  holidaySet: Set<string>,
  useFirstBusinessDayOfMonth: boolean
): string {
  if (!useFirstBusinessDayOfMonth) {
    return activationStartYMD;
  }

  const [year, month] = currentYMD.split("-").map(Number);
  const firstBusinessDayOfMonthYMD = getFirstBusinessDayOfMonthYMD(
    year,
    month,
    holidaySet
  );

  return maxYmd(activationStartYMD, firstBusinessDayOfMonthYMD);
}

export function isWorkEntryRequiredOnDateForUserMeta(args: {
  currentYMD: string;
  fullName: string;
  companySubdomain?: string;
}): boolean {
  const currentDate = parseIsoDateToUtc(args.currentYMD);

  if (!isWeekdayUtcDate(currentDate)) {
    return false;
  }

  const holidaySet = getHolidaySetForYears(
    currentDate.getUTCFullYear(),
    currentDate.getUTCFullYear()
  );

  if (holidaySet.has(args.currentYMD)) {
    return false;
  }

  const rule = getMissingEntriesRule(args.companySubdomain);
  const activationStartYMD = getMissingEntriesActivationStartYMD(
    args.fullName,
    args.companySubdomain
  );
  const effectiveStartYMD = getEffectiveMissingEntriesStartForDay(
    args.currentYMD,
    activationStartYMD,
    holidaySet,
    rule.useFirstBusinessDayOfMonth
  );

  return args.currentYMD >= effectiveStartYMD;
}

function getHolidaySetForYears(startYear: number, endYear: number): Set<string> {
  const hd = new Holidays("DE", "BW");
  const result = new Set<string>();

  for (let year = startYear; year <= endYear; year += 1) {
    const holidays = hd.getHolidays(year);
    for (const holiday of holidays) {
      if (holiday.type === "public") {
        result.add(holiday.date.slice(0, 10));
      }
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
  untilDateYMD: string,
  options?: {
    includeUntilDate?: boolean;
    companyId?: string;
  }
): Promise<string[]> {
  const untilDate = parseIsoDateToUtc(untilDateYMD);

  const user = await prisma.appUser.findFirst({
    where: {
      id: userId,
      ...(options?.companyId ? { companyId: options.companyId } : {}),
    },
    select: {
      isActive: true,
      fullName: true,
      company: {
        select: {
          subdomain: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return [];
  }

  const companySubdomain = user.company?.subdomain ?? undefined;

  const activationStartYMD = getMissingEntriesActivationStartYMD(
    user.fullName,
    companySubdomain
  );
  const effectiveRangeStartDate = parseIsoDateToUtc(activationStartYMD);

  if (effectiveRangeStartDate >= untilDate) {
    return [];
  }

  const rangeEndExclusive =
    options?.includeUntilDate === true ? addUtcDays(untilDate, 1) : untilDate;

  const [entries, absences] = await prisma.$transaction([
    prisma.workEntry.findMany({
      where: {
        userId,
        workDate: {
          gte: effectiveRangeStartDate,
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
          gte: effectiveRangeStartDate,
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
    effectiveRangeStartDate.getUTCFullYear(),
    untilDate.getUTCFullYear()
  );

  const missingDates: string[] = [];

  for (
    let current = new Date(effectiveRangeStartDate.getTime());
    current < rangeEndExclusive;
    current = addUtcDays(current, 1)
  ) {
    const currentYMD = isoDayUTC(current);

    if (
      !isWorkEntryRequiredOnDateForUserMeta({
        currentYMD,
        fullName: user.fullName,
        companySubdomain,
      })
    ) {
      continue;
    }

    if (absenceDateSet.has(currentYMD)) continue;
    if (entryDateSet.has(currentYMD)) continue;

    missingDates.push(currentYMD);
  }

  return missingDates;
}

export async function getLockedMissingRequiredWorkDates(
  userId: string,
  untilDateYMD: string,
  graceBusinessDays: number = 5,
  companyId?: string
): Promise<string[]> {
  const missingDates = await getMissingRequiredWorkDates(userId, untilDateYMD, {
    companyId,
  });

  if (missingDates.length > graceBusinessDays) {
    return missingDates;
  }

  return [];
}

export async function hasActiveTimeEntryUnlock(
  userId: string,
  workDateYMD: string,
  now: Date = new Date(),
  companyId?: string
): Promise<boolean> {
  const unlock = await prisma.timeEntryUnlock.findFirst({
    where: {
      userId,
      workDate: parseIsoDateToUtc(workDateYMD),
      user: {
        ...(companyId ? { companyId } : {}),
      },
    },
    select: {
      id: true,
      expiresAt: true,
    },
  });

  if (!unlock) {
    return false;
  }

  if (unlock.expiresAt && unlock.expiresAt.getTime() < now.getTime()) {
    return false;
  }

  return true;
}

export async function consumeTimeEntryUnlock(
  _userId: string,
  _workDateYMD: string
): Promise<void> {
  return;
}

export async function assertEmployeeMayEditDate(args: {
  role: "ADMIN" | "EMPLOYEE";
  userId: string;
  workDateYMD: string;
  companyId?: string;
  now?: Date;
}): Promise<void> {
  if (args.role === "ADMIN") {
    return;
  }

  const now = args.now ?? new Date();
  const today = berlinTodayYMD(now);

  if (args.workDateYMD > today) {
    throw new Error("TIME_ENTRY_FUTURE_DATE_EDIT_FORBIDDEN");
  }

  const previousDateYMD = isoDayUTC(
    addUtcDays(parseIsoDateToUtc(args.workDateYMD), -1)
  );

  const missingBeforeTarget =
    previousDateYMD < args.workDateYMD
      ? await getMissingRequiredWorkDates(args.userId, previousDateYMD, {
          includeUntilDate: true,
          companyId: args.companyId,
        })
      : [];

  if (missingBeforeTarget.length > 0) {
    throw new Error(`TIME_ENTRY_OLDER_MISSING_ENTRIES_FIRST:${missingBeforeTarget[0]}`);
  }

  if (args.workDateYMD === today) {
    return;
  }

  const lockedMissingDates = await getLockedMissingRequiredWorkDates(
    args.userId,
    today,
    5,
    args.companyId
  );

  if (!lockedMissingDates.includes(args.workDateYMD)) {
    return;
  }

  const hasUnlock = await hasActiveTimeEntryUnlock(
    args.userId,
    args.workDateYMD,
    now,
    args.companyId
  );

  if (!hasUnlock) {
    throw new Error("TIME_ENTRY_LOCKED_DAY_REQUIRES_CORRECTION");
  }
}