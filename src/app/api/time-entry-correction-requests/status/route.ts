import { NextResponse } from "next/server";
import { TimeEntryCorrectionRequestStatus } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActiveTimeEntryUnlock } from "@/lib/timesheetLock";

function getString(value: string | null): string {
  return typeof value === "string" ? value : "";
}

function isYYYYMMDD(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function dateOnlyUTC(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

function toIsoDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

  if (!isYYYYMMDD(workDate)) {
    return NextResponse.json(
      { ok: false, error: "workDate muss YYYY-MM-DD sein." },
      { status: 400 }
    );
  }

  const workDateValue = dateOnlyUTC(workDate);

  const [activeUnlock, pendingRequest, latestDecisionRequest] = await Promise.all([
    hasActiveTimeEntryUnlock(session.userId, workDate),
    prisma.timeEntryCorrectionRequest.findFirst({
      where: {
        userId: session.userId,
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
  ]);

  return NextResponse.json({
    ok: true,
    workDate,
    hasActiveUnlock: activeUnlock,
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
  });
}