import { NextResponse } from "next/server";
import {
  AbsenceTimeMode,
  AbsenceType,
  MonthlyWorkEntryConfirmationStatus,
  Role,
  SickLeaveKind,
  TaskRequiredAction,
  TaskStatus,
} from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getNumber(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) ? value : 0;
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

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

function getMonthRange(year: number, month: number): {
  start: Date;
  endExclusive: Date;
  startYMD: string;
  endYMD: string;
} {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const endExclusive = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));

  return {
    start,
    endExclusive,
    startYMD: toIsoDateUTC(start),
    endYMD: toIsoDateUTC(lastDay),
  };
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

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json({ ok: false, error: "NOT_LOGGED_IN" }, { status: 401 });
  }

  if (session.role !== Role.EMPLOYEE) {
    return NextResponse.json({ ok: false, error: "ONLY_EMPLOYEES" }, { status: 403 });
  }

  const body: unknown = await req.json().catch(() => null);

  if (!isRecord(body)) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const year = getNumber(body["year"]);
  const month = getNumber(body["month"]);
  const sourceTaskId = getString(body["sourceTaskId"]).trim();

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ ok: false, error: "INVALID_MONTH" }, { status: 400 });
  }

  const range = getMonthRange(year, month);

  const entries = await prisma.workEntry.findMany({
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
      createdAt: true,
      updatedAt: true,
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
      createdAt: true,
    },
  });

  if (entries.length === 0 && doctorAppointmentRows.length === 0) {
    return NextResponse.json({ ok: false, error: "NO_ENTRIES_TO_CONFIRM" }, { status: 409 });
  }

  const workEntrySnapshot = entries.map((entry) => ({
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
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  }));

  const doctorAppointmentSnapshot = doctorAppointmentRows
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
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.createdAt.toISOString(),
    }));

  const entrySnapshot = [
    ...workEntrySnapshot,
    ...doctorAppointmentSnapshot,
  ].sort((a, b) => {
    if (a.workDate !== b.workDate) {
      return a.workDate < b.workDate ? -1 : 1;
    }

    if (a.startTime !== b.startTime) {
      return a.startTime < b.startTime ? -1 : 1;
    }

    return 0;
  });

  const now = new Date();
  const confirmationText = buildConfirmationText(year, month);

  await prisma.$transaction(async (tx) => {
    await tx.monthlyWorkEntryConfirmation.upsert({
      where: {
        userId_year_month: {
          userId: session.userId,
          year,
          month,
        },
      },
      update: {
        status: MonthlyWorkEntryConfirmationStatus.CONFIRMED,
        confirmedAt: now,
        rejectedAt: null,
        rejectionReason: null,
        rejectionReasonSourceLanguage: null,
        rejectionReasonTranslations: undefined,
        confirmationText,
        confirmationTextSourceLanguage: "DE",
        confirmationTextTranslations: undefined,
        entrySnapshot,
        requiredUntilAt: null,
      },
      create: {
        userId: session.userId,
        year,
        month,
        status: MonthlyWorkEntryConfirmationStatus.CONFIRMED,
        confirmedAt: now,
        confirmationText,
        confirmationTextSourceLanguage: "DE",
        entrySnapshot,
      },
    });

    await tx.task.updateMany({
      where: {
        assignedToUserId: session.userId,
        status: TaskStatus.OPEN,
        requiredAction: TaskRequiredAction.CONFIRM_MONTHLY_WORK_ENTRIES,
        referenceStartDate: dateOnlyUTC(range.startYMD),
        referenceEndDate: dateOnlyUTC(range.endYMD),
      },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: now,
        completedByUserId: session.userId,
      },
    });

    if (sourceTaskId) {
      await tx.task.updateMany({
        where: {
          id: sourceTaskId,
          assignedToUserId: session.userId,
          status: TaskStatus.OPEN,
          requiredAction: TaskRequiredAction.CONFIRM_MONTHLY_WORK_ENTRIES,
        },
        data: {
          status: TaskStatus.COMPLETED,
          completedAt: now,
          completedByUserId: session.userId,
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}