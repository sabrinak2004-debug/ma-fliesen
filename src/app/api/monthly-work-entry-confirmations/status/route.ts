import Holidays from "date-holidays";
import { NextResponse } from "next/server";
import {
  AbsenceTimeMode,
  AbsenceType,
  MonthlyWorkEntryConfirmationStatus,
  Role,
  SickLeaveKind,
} from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  berlinTodayYMD,
  getMissingRequiredWorkDates,
} from "@/lib/timesheetLock";

type MonthlyConfirmationEntryDTO = {
  id: string;
  kind: "WORK_ENTRY" | "DOCTOR_APPOINTMENT";
  workDate: string;
  startTime: string;
  endTime: string;
  activity: string;
  location: string;
  travelMinutes: number;
  grossMinutes: number;
  breakMinutes: number;
  workMinutes: number;
  noteEmployee: string;
};

function dateOnlyUTC(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

function toIsoDateUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toHHMMUTC(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function isWeekdayUTC(date: Date): boolean {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
}

function addUtcDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function getHolidaySetForYear(year: number): Set<string> {
  const hd = new Holidays("DE", "BW");
  const result = new Set<string>();

  for (const holiday of hd.getHolidays(year)) {
    if (holiday.type === "public") {
      result.add(holiday.date.slice(0, 10));
    }
  }

  return result;
}

function getLastWorkdayOfMonthYMD(year: number, month: number): string {
  const holidaySet = getHolidaySetForYear(year);
  const nextMonthStart = new Date(Date.UTC(year, month, 1));
  let current = addUtcDays(nextMonthStart, -1);

  while (!isWeekdayUTC(current) || holidaySet.has(toIsoDateUTC(current))) {
    current = addUtcDays(current, -1);
  }

  return toIsoDateUTC(current);
}

function getMonthRange(year: number, month: number): {
  start: Date;
  endExclusive: Date;
  startYMD: string;
  endYMD: string;
} {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const endExclusive = new Date(Date.UTC(year, month, 1));
  const lastDay = addUtcDays(endExclusive, -1);

  return {
    start,
    endExclusive,
    startYMD: toIsoDateUTC(start),
    endYMD: toIsoDateUTC(lastDay),
  };
}

function parseMonthParam(value: string | null): { year: number; month: number } | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

function buildConfirmationText(year: number, month: number): string {
  const monthText = String(month).padStart(2, "0");

  return [
    `Ich bestätige hiermit, dass ich meine Arbeitszeiteinträge für den Monat ${monthText}/${year} geprüft habe.`,
    "Die aufgeführten Einträge entsprechen nach bestem Wissen und Gewissen den tatsächlich geleisteten Arbeitszeiten, Einsatzorten, Tätigkeiten, Pausen und Fahrtzeiten.",
    "Mir ist bewusst, dass vorsätzlich oder fahrlässig falsche Angaben arbeitsrechtliche Konsequenzen haben können.",
    "Mit der Bestätigung werden die aufgeführten Einträge als von mir geprüft und freigegeben dokumentiert.",
  ].join("\n");
}

export async function GET(req: Request): Promise<NextResponse> {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json({ ok: false, error: "NOT_LOGGED_IN" }, { status: 401 });
  }

  if (session.role !== Role.EMPLOYEE) {
    return NextResponse.json({ ok: false, error: "ONLY_EMPLOYEES" }, { status: 403 });
  }

  const url = new URL(req.url);
  const requestedMonth = parseMonthParam(url.searchParams.get("month"));
  const todayYMD = berlinTodayYMD();

  const currentYear = Number(todayYMD.slice(0, 4));
  const currentMonth = Number(todayYMD.slice(5, 7));

  const year = requestedMonth?.year ?? currentYear;
  const month = requestedMonth?.month ?? currentMonth;

  const lastWorkdayYMD = getLastWorkdayOfMonthYMD(year, month);

  if (todayYMD < lastWorkdayYMD) {
    return NextResponse.json({
      ok: true,
      shouldOpen: false,
      reason: "NOT_LAST_WORKDAY_YET",
      year,
      month,
      lastWorkday: lastWorkdayYMD,
      entries: [],
    });
  }

  const existing = await prisma.monthlyWorkEntryConfirmation.findUnique({
    where: {
      userId_year_month: {
        userId: session.userId,
        year,
        month,
      },
    },
    select: {
      status: true,
      rejectedAt: true,
      requiredUntilAt: true,
    },
  });

  if (existing?.status === MonthlyWorkEntryConfirmationStatus.CONFIRMED) {
    return NextResponse.json({
      ok: true,
      shouldOpen: false,
      reason: "ALREADY_CONFIRMED",
      year,
      month,
      lastWorkday: lastWorkdayYMD,
      entries: [],
    });
  }

  const missingDates = await getMissingRequiredWorkDates(session.userId, lastWorkdayYMD, {
    includeUntilDate: true,
    companyId: session.companyId,
  });

  if (missingDates.length > 0) {
    return NextResponse.json({
      ok: true,
      shouldOpen: false,
      reason: "MISSING_REQUIRED_ENTRIES",
      year,
      month,
      lastWorkday: lastWorkdayYMD,
      missingDates,
      entries: [],
    });
  }

  const range = getMonthRange(year, month);

  const rows = await prisma.workEntry.findMany({
    where: {
      userId: session.userId,
      workDate: {
        gte: range.start,
        lt: range.endExclusive,
      },
    },
    orderBy: [{ workDate: "asc" }, { startTime: "asc" }],
    select: {
      id: true,
      workDate: true,
      startTime: true,
      endTime: true,
      activity: true,
      location: true,
      travelMinutes: true,
      grossMinutes: true,
      breakMinutes: true,
      workMinutes: true,
      noteEmployee: true,
    },
  });

  const doctorAppointmentRows = await prisma.absence.findMany({
    where: {
      userId: session.userId,
      type: AbsenceType.SICK,
      sickLeaveKind: SickLeaveKind.DOCTOR_APPOINTMENT,
      timeMode: AbsenceTimeMode.TIME_RANGE,
      absenceDate: {
        gte: range.start,
        lt: range.endExclusive,
      },
    },
    orderBy: [{ absenceDate: "asc" }, { startTime: "asc" }],
    select: {
      id: true,
      absenceDate: true,
      startTime: true,
      endTime: true,
      paidMinutes: true,
    },
  });

  const workEntries: MonthlyConfirmationEntryDTO[] = rows.map((entry) => ({
    id: entry.id,
    kind: "WORK_ENTRY",
    workDate: toIsoDateUTC(entry.workDate),
    startTime: toHHMMUTC(entry.startTime),
    endTime: toHHMMUTC(entry.endTime),
    activity: entry.activity,
    location: entry.location,
    travelMinutes: entry.travelMinutes,
    grossMinutes: entry.grossMinutes,
    breakMinutes: entry.breakMinutes,
    workMinutes: entry.workMinutes,
    noteEmployee: entry.noteEmployee ?? "",
  }));

  const doctorAppointments: MonthlyConfirmationEntryDTO[] =
    doctorAppointmentRows
      .filter((appointment) => appointment.startTime && appointment.endTime && appointment.paidMinutes > 0)
      .map((appointment) => ({
        id: appointment.id,
        kind: "DOCTOR_APPOINTMENT",
        workDate: toIsoDateUTC(appointment.absenceDate),
        startTime: toHHMMUTC(appointment.startTime ?? new Date("1970-01-01T00:00:00.000Z")),
        endTime: toHHMMUTC(appointment.endTime ?? new Date("1970-01-01T00:00:00.000Z")),
        activity: "Arzttermin",
        location: "—",
        travelMinutes: 0,
        grossMinutes: appointment.paidMinutes,
        breakMinutes: 0,
        workMinutes: appointment.paidMinutes,
        noteEmployee: "",
      }));

  const entries: MonthlyConfirmationEntryDTO[] = [
    ...workEntries,
    ...doctorAppointments,
  ].sort((a, b) => {
    if (a.workDate !== b.workDate) {
      return a.workDate < b.workDate ? -1 : 1;
    }

    if (a.startTime !== b.startTime) {
      return a.startTime < b.startTime ? -1 : 1;
    }

    return 0;
  });

  return NextResponse.json({
    ok: true,
    shouldOpen: entries.length > 0,
    reason: existing?.status === MonthlyWorkEntryConfirmationStatus.REJECTED
      ? "REJECTED_NEEDS_CONFIRMATION"
      : "READY_FOR_CONFIRMATION",
    year,
    month,
    lastWorkday: lastWorkdayYMD,
    requiredUntilAt: existing?.requiredUntilAt?.toISOString() ?? null,
    confirmationText: buildConfirmationText(year, month),
    entries,
  });
}