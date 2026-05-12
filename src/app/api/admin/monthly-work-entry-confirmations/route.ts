import { NextResponse } from "next/server";
import { MonthlyWorkEntryConfirmationStatus, Prisma, Role } from "@prisma/client";
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
    value === MonthlyWorkEntryConfirmationStatus.PENDING ||
    value === MonthlyWorkEntryConfirmationStatus.CONFIRMED ||
    value === MonthlyWorkEntryConfirmationStatus.REJECTED
  );
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

  const confirmations: MonthlyConfirmationListItem[] = rows.map((row) => ({
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
    entries: parseEntrySnapshot(row.entrySnapshot),
  }));

  return NextResponse.json({
    ok: true,
    confirmations,
  });
}