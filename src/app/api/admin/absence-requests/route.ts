import { NextResponse } from "next/server";
import {
  AbsenceCompensation,
  AbsenceDayPortion,
  AbsenceRequestStatus,
  AbsenceTimeMode,
  AbsenceType,
  Prisma,
  SickLeaveKind,
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

function toHHMMUTC(date: Date | null): string | null {
  if (!date) return null;

  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
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
    language === "KU" ||
    language === "RO"
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

function eachDateYmdInclusive(startDate: Date, endDate: Date): string[] {
  const result: string[] = [];
  const cursor = new Date(startDate.getTime());

  while (cursor <= endDate) {
    result.push(toIsoDateUTC(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
}

function getOverwrittenVacationDatesForRequest(
  request: {
    startDate: Date;
    endDate: Date;
    type: AbsenceType;
  },
  sickDateSet: Set<string>
): string[] {
  if (request.type !== AbsenceType.VACATION) {
    return [];
  }

  return eachDateYmdInclusive(request.startDate, request.endDate).filter((date) =>
    sickDateSet.has(date)
  );
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
    sickLeaveKind: SickLeaveKind | null;
    timeMode: AbsenceTimeMode;
    startTime: Date | null;
    endTime: Date | null;
    paidMinutes: number;
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
    overwrittenBySickDates?: string[];
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
    sickLeaveKind: r.sickLeaveKind,
    timeMode: r.timeMode,
    startTime: toHHMMUTC(r.startTime),
    endTime: toHHMMUTC(r.endTime),
    paidMinutes: r.paidMinutes,
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
    overwrittenBySickDates: r.overwrittenBySickDates ?? [],
  };
}

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN" },
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

  const where: Prisma.AbsenceRequestWhereInput = {
    user: {
      companyId: admin.companyId,
    },
  };

  if (typeParam) {
    if (!isAbsenceType(typeParam)) {
      return NextResponse.json(
        { ok: false, error: "INVALID_TYPE" },
        { status: 400 }
      );
    }
    where.type = typeParam;
  }

  if (statusParam) {
    if (!isAbsenceRequestStatus(statusParam)) {
      return NextResponse.json(
        { ok: false, error: "INVALID_STATUS" },
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
        { ok: false, error: "INVALID_MONTH_FORMAT" },
        { status: 400 }
      );
    }

    const year = Number(monthParam.slice(0, 4));
    const month = Number(monthParam.slice(5, 7));

    const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const nextMonthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

    if (typeParam === "SICK") {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          startDate: {
            lt: nextMonthStart,
          },
          endDate: {
            gte: monthStart,
          },
        },
      ];
    } else {
      where.createdAt = {
        gte: monthStart,
        lt: nextMonthStart,
      };
    }
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

  const vacationRequests = requests.filter(
    (request) =>
      request.type === AbsenceType.VACATION &&
      request.status === AbsenceRequestStatus.APPROVED
  );

  const sickDateSetByUser = new Map<string, Set<string>>();

  if (vacationRequests.length > 0) {
    const minVacationStart = vacationRequests.reduce((minDate, request) => {
      return request.startDate < minDate ? request.startDate : minDate;
    }, vacationRequests[0].startDate);

    const maxVacationEnd = vacationRequests.reduce((maxDate, request) => {
      return request.endDate > maxDate ? request.endDate : maxDate;
    }, vacationRequests[0].endDate);

    const sickAbsences = await prisma.absence.findMany({
      where: {
        user: {
          companyId: admin.companyId,
        },
        type: AbsenceType.SICK,
        absenceDate: {
          gte: minVacationStart,
          lte: maxVacationEnd,
        },
        ...(userIdParam ? { userId: userIdParam } : {}),
      },
      select: {
        userId: true,
        absenceDate: true,
      },
    });

    for (const sickAbsence of sickAbsences) {
      const set = sickDateSetByUser.get(sickAbsence.userId) ?? new Set<string>();
      set.add(toIsoDateUTC(sickAbsence.absenceDate));
      sickDateSetByUser.set(sickAbsence.userId, set);
    }
  }

  const requestsWithSickOverwriteInfo = requests.map((request) => ({
    ...request,
    overwrittenBySickDates: getOverwrittenVacationDatesForRequest(
      request,
      sickDateSetByUser.get(request.userId) ?? new Set<string>()
    ),
  }));

  const grouped = {
    pending: requests.filter((r) => r.status === AbsenceRequestStatus.PENDING),
    approved: requests.filter((r) => r.status === AbsenceRequestStatus.APPROVED),
    rejected: requests.filter((r) => r.status === AbsenceRequestStatus.REJECTED),
  };

  return NextResponse.json({
    ok: true,
    requests: requestsWithSickOverwriteInfo.map((request) =>
      mapRequest(request, adminUser?.language ?? "DE")
    ),
    grouped: {
      pending: requestsWithSickOverwriteInfo
        .filter((request) => request.status === AbsenceRequestStatus.PENDING)
        .map((request) => mapRequest(request, adminUser?.language ?? "DE")),
      approved: requestsWithSickOverwriteInfo
        .filter((request) => request.status === AbsenceRequestStatus.APPROVED)
        .map((request) => mapRequest(request, adminUser?.language ?? "DE")),
      rejected: requestsWithSickOverwriteInfo
        .filter((request) => request.status === AbsenceRequestStatus.REJECTED)
        .map((request) => mapRequest(request, adminUser?.language ?? "DE")),
    },
  });
}