import { NextResponse } from "next/server";
import {
  AbsenceCompensation,
  AbsenceDayPortion,
  AbsenceRequestStatus,
  AbsenceType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

function isAbsenceType(v: string): v is AbsenceType {
  return v === "VACATION" || v === "SICK";
}

function isAbsenceRequestStatus(v: string): v is AbsenceRequestStatus {
  return v === "PENDING" || v === "APPROVED" || v === "REJECTED";
}

function toIsoDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const ANNUAL_VACATION_DAYS = 30;
const MONTHLY_VACATION_ACCRUAL_DAYS = ANNUAL_VACATION_DAYS / 12;

function startOfUtcYear(year: number): Date {
  return new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
}

function startOfNextUtcYear(year: number): Date {
  return new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
}

function getAccruedVacationDaysUntilDate(date: Date): number {
  const monthOneBased = date.getUTCMonth() + 1;
  return Math.min(ANNUAL_VACATION_DAYS, monthOneBased * MONTHLY_VACATION_ACCRUAL_DAYS);
}

function isUtcWeekday(date: Date): boolean {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
}

function buildEffectiveVacationDays(
  startDate: Date,
  endDate: Date,
  dayPortion: AbsenceDayPortion
): Date[] {
  if (dayPortion === AbsenceDayPortion.HALF_DAY) {
    return [new Date(startDate)];
  }

  const out: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const copy = new Date(current);
    if (isUtcWeekday(copy)) {
      out.push(copy);
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return out;
}

function getRequestedVacationUnits(
  startDate: Date,
  endDate: Date,
  dayPortion: AbsenceDayPortion
): number {
  if (dayPortion === AbsenceDayPortion.HALF_DAY) {
    return 1;
  }

  return buildEffectiveVacationDays(startDate, endDate, dayPortion).length * 2;
}

type RequestWithRelations = {
  id: string;
  startDate: Date;
  endDate: Date;
  type: AbsenceType;
  dayPortion: AbsenceDayPortion;
  status: AbsenceRequestStatus;
  compensation: AbsenceCompensation;
  paidVacationUnits: number;
  unpaidVacationUnits: number;
  autoUnpaidBecauseNoBalance: boolean;
  compensationLockedBySystem: boolean;
  noteEmployee: string | null;
  createdAt: Date;
  updatedAt: Date;
  decidedAt: Date | null;
  userId: string;
  user: {
    id: string;
    fullName: string;
  };
  decidedBy: {
    id: string;
    fullName: string;
  } | null;
};

function withPreviewVacationSplit(
  requests: RequestWithRelations[],
  approvedPaidUnitsByUserAndYear: Map<string, number>
): RequestWithRelations[] {
  const previewAllocatedPaidUnits = new Map<string, number>();

  const sortedPendingVacationIds = new Set(
    requests
      .filter(
        (request) =>
          request.status === AbsenceRequestStatus.PENDING &&
          request.type === AbsenceType.VACATION
      )
      .sort((a, b) => {
        const endDiff = a.endDate.getTime() - b.endDate.getTime();
        if (endDiff !== 0) return endDiff;

        const startDiff = a.startDate.getTime() - b.startDate.getTime();
        if (startDiff !== 0) return startDiff;

        const createdDiff = a.createdAt.getTime() - b.createdAt.getTime();
        if (createdDiff !== 0) return createdDiff;

        return a.id.localeCompare(b.id);
      })
      .map((request) => request.id)
  );

  const sortedRequests = [...requests].sort((a, b) => {
    const aRank = sortedPendingVacationIds.has(a.id) ? 0 : 1;
    const bRank = sortedPendingVacationIds.has(b.id) ? 0 : 1;

    if (aRank !== bRank) return aRank - bRank;

    const endDiff = a.endDate.getTime() - b.endDate.getTime();
    if (endDiff !== 0) return endDiff;

    const startDiff = a.startDate.getTime() - b.startDate.getTime();
    if (startDiff !== 0) return startDiff;

    const createdDiff = a.createdAt.getTime() - b.createdAt.getTime();
    if (createdDiff !== 0) return createdDiff;

    return a.id.localeCompare(b.id);
  });

  const normalizedById = new Map<string, RequestWithRelations>();

  for (const request of sortedRequests) {
    if (
      request.status !== AbsenceRequestStatus.PENDING ||
      request.type !== AbsenceType.VACATION
    ) {
      normalizedById.set(request.id, request);
      continue;
    }

    const balanceYear = request.endDate.getUTCFullYear();
    const key = `${request.userId}:${balanceYear}`;
    const accruedUnits = Math.round(getAccruedVacationDaysUntilDate(request.endDate) * 2);
    const approvedPaidUnits = approvedPaidUnitsByUserAndYear.get(key) ?? 0;
    const alreadyPreviewAllocatedPaidUnits = previewAllocatedPaidUnits.get(key) ?? 0;

    const requestedUnits = getRequestedVacationUnits(
      request.startDate,
      request.endDate,
      request.dayPortion
    );

    const availablePaidUnits = Math.max(
      0,
      accruedUnits - approvedPaidUnits - alreadyPreviewAllocatedPaidUnits
    );

    const nextPaidVacationUnits = Math.min(availablePaidUnits, requestedUnits);
    const nextUnpaidVacationUnits = Math.max(0, requestedUnits - nextPaidVacationUnits);

    previewAllocatedPaidUnits.set(
      key,
      alreadyPreviewAllocatedPaidUnits + nextPaidVacationUnits
    );

    normalizedById.set(request.id, {
      ...request,
      compensation:
        nextPaidVacationUnits > 0
          ? AbsenceCompensation.PAID
          : AbsenceCompensation.UNPAID,
      paidVacationUnits: nextPaidVacationUnits,
      unpaidVacationUnits: nextUnpaidVacationUnits,
      autoUnpaidBecauseNoBalance: nextUnpaidVacationUnits > 0,
      compensationLockedBySystem: nextUnpaidVacationUnits > 0,
    });
  }

  return requests.map((request) => normalizedById.get(request.id) ?? request);
}

function mapRequest(r: {
  id: string;
  startDate: Date;
  endDate: Date;
  type: AbsenceType;
  dayPortion: AbsenceDayPortion;
  status: AbsenceRequestStatus;
  compensation: AbsenceCompensation;
  paidVacationUnits: number;
  unpaidVacationUnits: number;
  autoUnpaidBecauseNoBalance: boolean;
  compensationLockedBySystem: boolean;
  noteEmployee: string | null;
  createdAt: Date;
  updatedAt: Date;
  decidedAt: Date | null;
  user: {
    id: string;
    fullName: string;
  };
  decidedBy: {
    id: string;
    fullName: string;
  } | null;
}) {
  return {
    id: r.id,
    startDate: toIsoDateUTC(r.startDate),
    endDate: toIsoDateUTC(r.endDate),
    type: r.type,
    dayPortion: r.dayPortion,
    status: r.status,
    compensation: r.compensation,
    paidVacationUnits: r.paidVacationUnits,
    unpaidVacationUnits: r.unpaidVacationUnits,
    autoUnpaidBecauseNoBalance: r.autoUnpaidBecauseNoBalance,
    compensationLockedBySystem: r.compensationLockedBySystem,
    noteEmployee: r.noteEmployee ?? "",
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    decidedAt: r.decidedAt ? r.decidedAt.toISOString() : null,
    user: {
      id: r.user.id,
      fullName: r.user.fullName,
    },
    decidedBy: r.decidedBy
      ? {
          id: r.decidedBy.id,
          fullName: r.decidedBy.fullName,
        }
      : null,
  };
}

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Keine Berechtigung." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);

  const typeParam = (searchParams.get("type") ?? "").trim();
  const statusParam = (searchParams.get("status") ?? "").trim();
  const userIdParam = (searchParams.get("userId") ?? "").trim();
  const monthParam = (searchParams.get("month") ?? "").trim();

  const where: {
    type?: AbsenceType;
    status?: AbsenceRequestStatus;
    userId?: string;
    startDate?: { lt: Date };
    endDate?: { gte: Date };
    user?: { companyId: string };
  } = {
    user: {
      companyId: admin.companyId,
    },
  };

  if (typeParam) {
    if (!isAbsenceType(typeParam)) {
      return NextResponse.json(
        { ok: false, error: "Ungültiger Typ." },
        { status: 400 }
      );
    }
    where.type = typeParam;
  }

  if (statusParam) {
    if (!isAbsenceRequestStatus(statusParam)) {
      return NextResponse.json(
        { ok: false, error: "Ungültiger Status." },
        { status: 400 }
      );
    }
    where.status = statusParam;
  }

  if (userIdParam) {
    where.userId = userIdParam;
  }

  if (monthParam) {
    if (!/^\d{4}-\d{2}$/.test(monthParam)) {
      return NextResponse.json(
        { ok: false, error: "month muss YYYY-MM sein." },
        { status: 400 }
      );
    }

    const year = Number(monthParam.slice(0, 4));
    const month = Number(monthParam.slice(5, 7));

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const nextMonthStart = new Date(Date.UTC(year, month, 1));

    where.startDate = { lt: nextMonthStart };
    where.endDate = { gte: monthStart };
  }

  const requests = await prisma.absenceRequest.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
      decidedBy: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const relevantYears = Array.from(
    new Set(requests.map((request) => request.endDate.getUTCFullYear()))
  );

  const approvedPaidAbsences = await prisma.absence.findMany({
    where: {
      user: {
        companyId: admin.companyId,
      },
      type: AbsenceType.VACATION,
      compensation: AbsenceCompensation.PAID,
      absenceDate: {
        gte: new Date(Date.UTC(Math.min(...relevantYears), 0, 1, 0, 0, 0, 0)),
        lt: new Date(Date.UTC(Math.max(...relevantYears) + 1, 0, 1, 0, 0, 0, 0)),
      },
    },
    select: {
      userId: true,
      absenceDate: true,
      dayPortion: true,
    },
  });

  const approvedPaidUnitsByUserAndYear = new Map<string, number>();

  for (const row of approvedPaidAbsences) {
    const year = row.absenceDate.getUTCFullYear();
    const key = `${row.userId}:${year}`;
    const units = row.dayPortion === AbsenceDayPortion.HALF_DAY ? 1 : 2;

    approvedPaidUnitsByUserAndYear.set(
      key,
      (approvedPaidUnitsByUserAndYear.get(key) ?? 0) + units
    );
  }

  const normalizedRequests = withPreviewVacationSplit(
    requests,
    approvedPaidUnitsByUserAndYear
  );

  const grouped = {
    pending: normalizedRequests.filter((r) => r.status === AbsenceRequestStatus.PENDING),
    approved: normalizedRequests.filter((r) => r.status === AbsenceRequestStatus.APPROVED),
    rejected: normalizedRequests.filter((r) => r.status === AbsenceRequestStatus.REJECTED),
  };

  return NextResponse.json({
    ok: true,
    requests: normalizedRequests.map(mapRequest),
    grouped: {
      pending: grouped.pending.map(mapRequest),
      approved: grouped.approved.map(mapRequest),
      rejected: grouped.rejected.map(mapRequest),
    },
  });
}