import { NextResponse } from "next/server";
import {
  AbsenceTimeMode,
  AbsenceType,
  MonthlyWorkEntryConfirmationStatus,
  Prisma,
  Role,
  SickLeaveKind,
} from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SnapshotEntryKind = "WORK_ENTRY" | "DOCTOR_APPOINTMENT";

type MonthlyConfirmationSnapshotEntry = {
  id: string;
  kind: SnapshotEntryKind;
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
  createdAt: string;
  updatedAt: string;
};

type MonthlyConfirmationListItem = {
  id: string;
  user: {
    id: string;
    fullName: string;
  };
  year: number;
  month: number;
  status: MonthlyWorkEntryConfirmationStatus;
  confirmedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  confirmationText: string | null;
  requiredUntilAt: string | null;
  updatedAt: string;
  entries: MonthlyConfirmationSnapshotEntry[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isSnapshotEntryKind(value: unknown): value is SnapshotEntryKind {
  return value === "WORK_ENTRY" || value === "DOCTOR_APPOINTMENT";
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
} {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    endExclusive: new Date(Date.UTC(year, month, 1)),
  };
}

function parseSnapshotEntry(value: unknown): MonthlyConfirmationSnapshotEntry | null {
  if (!isRecord(value)) {
    return null;
  }

  const kind = value["kind"];

  if (!isSnapshotEntryKind(kind)) {
    return null;
  }

  const id = getString(value["id"]);
  const workDate = getString(value["workDate"]);
  const startTime = getString(value["startTime"]);
  const endTime = getString(value["endTime"]);

  if (!id || !workDate || !startTime || !endTime) {
    return null;
  }

  return {
    id,
    kind,
    workDate,
    startTime,
    endTime,
    activity: getString(value["activity"]),
    location: getString(value["location"]),
    travelMinutes: getNumber(value["travelMinutes"]),
    grossMinutes: getNumber(value["grossMinutes"]),
    breakMinutes: getNumber(value["breakMinutes"]),
    workMinutes: getNumber(value["workMinutes"]),
    noteEmployee: getString(value["noteEmployee"]),
    createdAt: getString(value["createdAt"]),
    updatedAt: getString(value["updatedAt"]),
  };
}

function parseEntrySnapshot(value: Prisma.JsonValue): MonthlyConfirmationSnapshotEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(parseSnapshotEntry)
    .filter((entry): entry is MonthlyConfirmationSnapshotEntry => entry !== null);
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

function isMonthlyConfirmationStatus(value: string | null): value is MonthlyWorkEntryConfirmationStatus {
  return (
    value === MonthlyWorkEntryConfirmationStatus.CONFIRMED ||
    value === MonthlyWorkEntryConfirmationStatus.REJECTED
  );
}

async function buildLiveSnapshotForUser(params: {
  userId: string;
  year: number;
  month: number;
}): Promise<MonthlyConfirmationSnapshotEntry[]> {
  const range = getMonthRange(params.year, params.month);

  const entries = await prisma.workEntry.findMany({
    where: {
      userId: params.userId,
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

  const doctorAppointments = await prisma.absence.findMany({
    where: {
      userId: params.userId,
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

  const workEntrySnapshot: MonthlyConfirmationSnapshotEntry[] = entries.map((entry) => ({
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

  const doctorAppointmentSnapshot: MonthlyConfirmationSnapshotEntry[] = doctorAppointments
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

  return [...workEntrySnapshot, ...doctorAppointmentSnapshot].sort((a, b) => {
    if (a.workDate !== b.workDate) {
      return a.workDate < b.workDate ? -1 : 1;
    }

    if (a.startTime !== b.startTime) {
      return a.startTime < b.startTime ? -1 : 1;
    }

    return 0;
  });
}

export async function GET(req: Request): Promise<NextResponse> {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json({ ok: false, error: "NOT_LOGGED_IN" }, { status: 401 });
  }

  if (session.role !== Role.ADMIN) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const url = new URL(req.url);
  const selectedMonth = parseMonthParam(url.searchParams.get("month"));
  const selectedUserId = url.searchParams.get("userId")?.trim() ?? "";
  const selectedStatus = url.searchParams.get("status");

  const rows = await prisma.monthlyWorkEntryConfirmation.findMany({
    where: {
      ...(selectedMonth
        ? {
            year: selectedMonth.year,
            month: selectedMonth.month,
          }
        : {}),
      ...(selectedUserId
        ? {
            userId: selectedUserId,
          }
        : {}),
      ...(isMonthlyConfirmationStatus(selectedStatus)
        ? {
            status: selectedStatus,
          }
        : {}),
      user: {
        companyId: session.companyId,
      },
    },
    orderBy: [
      { year: "desc" },
      { month: "desc" },
      { updatedAt: "desc" },
    ],
    select: {
      id: true,
      year: true,
      month: true,
      status: true,
      confirmedAt: true,
      rejectedAt: true,
      rejectionReason: true,
      confirmationText: true,
      requiredUntilAt: true,
      updatedAt: true,
      entrySnapshot: true,
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  const confirmations: MonthlyConfirmationListItem[] = await Promise.all(
    rows.map(async (row) => {
      const snapshotEntries = parseEntrySnapshot(row.entrySnapshot);
      const entries =
        snapshotEntries.length > 0
          ? snapshotEntries
          : await buildLiveSnapshotForUser({
              userId: row.user.id,
              year: row.year,
              month: row.month,
            });

      return {
        id: row.id,
        user: {
          id: row.user.id,
          fullName: row.user.fullName,
        },
        year: row.year,
        month: row.month,
        status: row.status,
        confirmedAt: row.confirmedAt?.toISOString() ?? null,
        rejectedAt: row.rejectedAt?.toISOString() ?? null,
        rejectionReason: row.rejectionReason,
        confirmationText: row.confirmationText,
        requiredUntilAt: row.requiredUntilAt?.toISOString() ?? null,
        updatedAt: row.updatedAt.toISOString(),
        entries,
      };
    })
  );

  return NextResponse.json({
    ok: true,
    confirmations,
  });
}