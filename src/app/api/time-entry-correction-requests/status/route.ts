import { NextResponse } from "next/server";
import {
  Role,
  TaskRequiredAction,
  TaskStatus,
  TimeEntryCorrectionRequestStatus,
} from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  berlinTodayYMD,
  getLockedMissingRequiredWorkDates,
  getMissingRequiredWorkDates,
  hasActiveTimeEntryUnlock,
} from "@/lib/timesheetLock";

function getString(value: string | null): string {
  return typeof value === "string" ? value : "";
}

function isYYYYMMDD(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function dateOnlyUTC(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

async function getAdminTaskBypassForWorkDate(args: {
  sourceTaskId: string;
  userId: string;
  companyId: string;
  workDate: string;
}): Promise<{
  active: boolean;
  taskId: string;
  workDate: string;
  startDate: string;
  endDate: string;
} | null> {
  if (!args.sourceTaskId) {
    return null;
  }

  const task = await prisma.task.findFirst({
    where: {
      id: args.sourceTaskId,
      assignedToUserId: args.userId,
      status: TaskStatus.OPEN,
      category: "WORK_TIME",
      requiredAction: TaskRequiredAction.WORK_ENTRY_FOR_DATE,
      assignedToUser: {
        companyId: args.companyId,
      },
      createdByUser: {
        role: Role.ADMIN,
        companyId: args.companyId,
      },
    },
    select: {
      id: true,
      referenceDate: true,
      referenceStartDate: true,
      referenceEndDate: true,
    },
  });

  if (!task) {
    return null;
  }

  const startDate = toIsoDateUTC(task.referenceStartDate ?? task.referenceDate ?? dateOnlyUTC(args.workDate));
  const endDate = toIsoDateUTC(task.referenceEndDate ?? task.referenceStartDate ?? task.referenceDate ?? dateOnlyUTC(args.workDate));

  if (args.workDate < startDate || args.workDate > endDate) {
    return null;
  }

  return {
    active: true,
    taskId: task.id,
    workDate: args.workDate,
    startDate,
    endDate,
  };
}

function toIsoDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

  const GRACE_WORKDAYS_LIMIT = 5;

export async function GET(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Nicht eingeloggt." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const workDate = getString(searchParams.get("workDate")).trim();
  const sourceTaskId = getString(searchParams.get("sourceTaskId")).trim();

  if (!isYYYYMMDD(workDate)) {
    return NextResponse.json(
      { ok: false, error: "workDate muss YYYY-MM-DD sein." },
      { status: 400 }
    );
  }

  const workDateValue = dateOnlyUTC(workDate);
  const todayYMD = berlinTodayYMD();

  const [
    activeUnlock,
    pendingRequest,
    latestDecisionRequest,
    missingRequiredWorkDates,
    lockedMissingWorkDates,
    adminTaskBypass,
  ] = await Promise.all([
    hasActiveTimeEntryUnlock(session.userId, workDate, new Date(), session.companyId),
    prisma.timeEntryCorrectionRequest.findFirst({
      where: {
        userId: session.userId,
        user: {
          companyId: session.companyId,
        },
        status: TimeEntryCorrectionRequestStatus.PENDING,
        startDate: { lte: workDateValue },
        endDate: { gte: workDateValue },
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    }),
    prisma.timeEntryCorrectionRequest.findFirst({
      where: {
        userId: session.userId,
        user: {
          companyId: session.companyId,
        },
        status: {
          in: [
            TimeEntryCorrectionRequestStatus.APPROVED,
            TimeEntryCorrectionRequestStatus.REJECTED,
          ],
        },
        startDate: { lte: workDateValue },
        endDate: { gte: workDateValue },
      },
      orderBy: [{ decidedAt: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    }),
    getMissingRequiredWorkDates(session.userId, todayYMD, {
      companyId: session.companyId,
    }),
    getLockedMissingRequiredWorkDates(
      session.userId,
      todayYMD,
      GRACE_WORKDAYS_LIMIT,
      session.companyId
    ),
    getAdminTaskBypassForWorkDate({
      sourceTaskId,
      userId: session.userId,
      companyId: session.companyId,
      workDate,
    }),
  ]);

  const missingRequiredWorkdaysCount = missingRequiredWorkDates.length;

  const requiresCorrectionRequest =
    workDate < todayYMD &&
    lockedMissingWorkDates.includes(workDate) &&
    adminTaskBypass === null;
  const lockedMissingWorkdaysCount = lockedMissingWorkDates.length;
  const currentMissingWorkdaysCount = missingRequiredWorkdaysCount;

  return NextResponse.json({
    ok: true,
    workDate,
    hasActiveUnlock: activeUnlock,
    requiresCorrectionRequest,
    currentMissingWorkdaysCount,
    lockedMissingWorkdaysCount,
    graceWorkdaysLimit: GRACE_WORKDAYS_LIMIT,
    pendingRequest: pendingRequest
      ? {
          id: pendingRequest.id,
          startDate: toIsoDateUTC(pendingRequest.startDate),
          endDate: toIsoDateUTC(pendingRequest.endDate),
          status: pendingRequest.status,
        }
      : null,
    latestDecisionRequest: latestDecisionRequest
      ? {
          id: latestDecisionRequest.id,
          startDate: toIsoDateUTC(latestDecisionRequest.startDate),
          endDate: toIsoDateUTC(latestDecisionRequest.endDate),
          status: latestDecisionRequest.status,
        }
      : null,
    adminTaskBypass,
  });
}