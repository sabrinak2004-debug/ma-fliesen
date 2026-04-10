import { NextResponse } from "next/server";
import {
  AbsenceCompensation,
  AbsenceDayPortion,
  AbsenceRequestStatus,
  AbsenceType,
  Prisma,
} from "@prisma/client";
import type { SupportedLang } from "@/lib/translate";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { rebalanceAutoUnpaidVacationRequestsForYear } from "@/app/api/absence-requests/route";

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

type TranslationMap = Partial<Record<SupportedLang, string>>;

function isTranslationMap(value: Prisma.JsonValue | null | undefined): value is TranslationMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return true;
}

function toSupportedLang(language: string | null | undefined): SupportedLang {
  if (
    language === "DE" ||
    language === "EN" ||
    language === "IT" ||
    language === "TR" ||
    language === "SQ" ||
    language === "KU"
  ) {
    return language;
  }

  return "DE";
}

function getTranslatedText(
  originalText: string | null | undefined,
  translations: Prisma.JsonValue | null | undefined,
  language: string | null | undefined
): string {
  const fallback = originalText ?? "";
  const targetLanguage = toSupportedLang(language);

  if (!isTranslationMap(translations)) {
    return fallback;
  }

  const translated = translations[targetLanguage];
  return typeof translated === "string" && translated.trim() ? translated : fallback;
}

function mapRequest(
  r: {
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
    noteEmployeeTranslations: Prisma.JsonValue | null;
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
  },
  language: string | null | undefined
) {
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
    noteEmployee: getTranslatedText(
      r.noteEmployee,
      r.noteEmployeeTranslations,
      language
    ),
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

  const adminUser = admin
    ? await prisma.appUser.findUnique({
        where: { id: admin.id },
        select: { language: true },
      })
    : null;

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

  const rebalanceYear = new Date().getUTCFullYear();

  const usersToRebalance = await prisma.appUser.findMany({
    where: {
      companyId: admin.companyId,
      role: "EMPLOYEE",
      isActive: true,
      ...(userIdParam ? { id: userIdParam } : {}),
    },
    select: {
      id: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  for (const user of usersToRebalance) {
    await rebalanceAutoUnpaidVacationRequestsForYear(
      user.id,
      rebalanceYear,
      new Date()
    );
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
    requests: requests.map((request) =>
      mapRequest(request, adminUser?.language ?? "DE")
    ),
    grouped: {
      pending: grouped.pending.map((request) =>
        mapRequest(request, adminUser?.language ?? "DE")
      ),
      approved: grouped.approved.map((request) =>
        mapRequest(request, adminUser?.language ?? "DE")
      ),
      rejected: grouped.rejected.map((request) =>
        mapRequest(request, adminUser?.language ?? "DE")
      ),
    },
  });
}