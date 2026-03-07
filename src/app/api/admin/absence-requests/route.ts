import { NextResponse } from "next/server";
import {
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

function mapRequest(r: {
  id: string;
  startDate: Date;
  endDate: Date;
  type: AbsenceType;
  dayPortion: AbsenceDayPortion;
  status: AbsenceRequestStatus;
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
  } = {};

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

  const grouped = {
    pending: requests.filter((r) => r.status === AbsenceRequestStatus.PENDING),
    approved: requests.filter((r) => r.status === AbsenceRequestStatus.APPROVED),
    rejected: requests.filter((r) => r.status === AbsenceRequestStatus.REJECTED),
  };

  return NextResponse.json({
    ok: true,
    requests: requests.map(mapRequest),
    grouped: {
      pending: grouped.pending.map(mapRequest),
      approved: grouped.approved.map(mapRequest),
      rejected: grouped.rejected.map(mapRequest),
    },
  });
}