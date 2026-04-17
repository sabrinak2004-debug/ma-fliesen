import { NextResponse } from "next/server";
import { AbsenceRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { buildPushUrl, sendPushToUser } from "@/lib/webpush";
import {
  ADMIN_ABSENCE_REQUESTS_API_TEXTS,
  normalizeAppUiLanguage,
  translate,
  type AdminAbsenceRequestsApiTextKey,
  type AppUiLanguage,
} from "@/lib/i18n";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function translateAdminAbsenceRequestText(
  language: AppUiLanguage,
  key: AdminAbsenceRequestsApiTextKey
): string {
  return translate(language, key, ADMIN_ABSENCE_REQUESTS_API_TEXTS);
}

function formatText(
  template: string,
  values: Record<string, string>
): string {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, value);
  }, template);
}

function getRequestTypeLabel(
  language: AppUiLanguage,
  type: "VACATION" | "SICK"
): string {
  return type === "VACATION"
    ? translateAdminAbsenceRequestText(language, "vacationRequestLabel")
    : translateAdminAbsenceRequestText(language, "sickRequestLabel");
}

export async function POST(_req: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const params = await context.params;
  const requestId = params.id.trim();

  if (!requestId) {
    return NextResponse.json(
      {
        ok: false,
        error: translateAdminAbsenceRequestText("DE", "missingRequestId"),
      },
      { status: 400 }
    );
  }

  const existing = await prisma.absenceRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          isActive: true,
          companyId: true,
          language: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json(
      {
        ok: false,
        error: translateAdminAbsenceRequestText("DE", "requestNotFound"),
      },
      { status: 404 }
    );
  }

  const employeeLanguage = normalizeAppUiLanguage(existing.user.language);

  if (existing.user.companyId !== admin.companyId) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  if (!existing.user.isActive) {
    return NextResponse.json(
      {
        ok: false,
        error: translateAdminAbsenceRequestText(employeeLanguage, "employeeInactive"),
      },
      { status: 409 }
    );
  }

  if (existing.status !== AbsenceRequestStatus.PENDING) {
    return NextResponse.json(
      {
        ok: false,
        error: translateAdminAbsenceRequestText(
          employeeLanguage,
          "onlyPendingCanBeRejected"
        ),
      },
      { status: 409 }
    );
  }

  const updated = await prisma.absenceRequest.update({
    where: { id: existing.id },
    data: {
      status: AbsenceRequestStatus.REJECTED,
      decidedAt: new Date(),
      decidedById: admin.id,
    },
  });

  const typeLabel = getRequestTypeLabel(employeeLanguage, existing.type);
  const startDate = existing.startDate.toISOString().slice(0, 10);
  const endDate = existing.endDate.toISOString().slice(0, 10);

  await sendPushToUser(existing.userId, {
    title: translateAdminAbsenceRequestText(employeeLanguage, "rejectedPushTitle"),
    body: formatText(
      translateAdminAbsenceRequestText(employeeLanguage, "rejectedPushBody"),
      {
        type: typeLabel,
      }
    ),
    url: buildPushUrl(
      `/kalender?openDate=${encodeURIComponent(startDate)}&absenceStart=${encodeURIComponent(startDate)}&absenceEnd=${encodeURIComponent(endDate)}&absenceType=${encodeURIComponent(existing.type)}&absenceDayPortion=${encodeURIComponent(existing.dayPortion)}&absenceCompensation=${encodeURIComponent(existing.compensation)}`
    ),
  });


  return NextResponse.json({
    ok: true,
    request: {
      id: existing.id,
      status: updated.status,
      decidedAt: updated.decidedAt?.toISOString() ?? null,
      decidedBy: {
        id: admin.id,
        fullName: admin.fullName,
      },
      user: {
        id: existing.user.id,
        fullName: existing.user.fullName,
      },
      type: existing.type,
    },
  });
}