import { NextResponse } from "next/server";
import { Prisma, TimeEntryCorrectionRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import type { SupportedLang } from "@/lib/translate";

function isTimeEntryCorrectionRequestStatus(v: string): v is TimeEntryCorrectionRequestStatus {
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

function mapRequest(
  r: {
    id: string;
    startDate: Date;
    endDate: Date;
    status: TimeEntryCorrectionRequestStatus;
    noteEmployee: string | null;
    noteEmployeeTranslations?: Prisma.JsonValue | null;
    noteAdmin: string | null;
    noteAdminTranslations?: Prisma.JsonValue | null;
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
    status: r.status,
    noteEmployee: getTranslatedText(
      r.noteEmployee,
      r.noteEmployeeTranslations,
      language
    ),
    noteAdmin: getTranslatedText(
      r.noteAdmin,
      r.noteAdminTranslations,
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
  const adminUser = admin
    ? await prisma.appUser.findUnique({
        where: { id: admin.id },
        select: { language: true },
      })
    : null;
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);

  const statusParam = (searchParams.get("status") ?? "").trim();
  const userIdParam = (searchParams.get("userId") ?? "").trim();
  const monthParam = (searchParams.get("month") ?? "").trim();

  const where: {
    status?: TimeEntryCorrectionRequestStatus;
    userId?: string;
    startDate?: { lt: Date };
    endDate?: { gte: Date };
    user?: {
      companyId: string;
    };
  } = {
    user: {
      companyId: admin.companyId,
    },
  };

  if (statusParam) {
    if (!isTimeEntryCorrectionRequestStatus(statusParam)) {
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

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const nextMonthStart = new Date(Date.UTC(year, month, 1));

    where.startDate = { lt: nextMonthStart };
    where.endDate = { gte: monthStart };
  }

  const requests = await prisma.timeEntryCorrectionRequest.findMany({
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
    pending: requests.filter((r) => r.status === TimeEntryCorrectionRequestStatus.PENDING),
    approved: requests.filter((r) => r.status === TimeEntryCorrectionRequestStatus.APPROVED),
    rejected: requests.filter((r) => r.status === TimeEntryCorrectionRequestStatus.REJECTED),
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