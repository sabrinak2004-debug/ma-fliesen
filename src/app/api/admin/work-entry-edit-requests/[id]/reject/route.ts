import { NextResponse } from "next/server";
import { WorkEntryEditRequestStatus } from "@prisma/client";
import {
  normalizeAppUiLanguage,
  TIME_ENTRY_CORRECTION_API_TEXTS,
  translate,
} from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { buildPushUrl, sendPushToUser } from "@/lib/webpush";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const params = await context.params;
  const requestId = params.id.trim();

  if (!requestId) {
    return NextResponse.json(
      { ok: false, error: "MISSING_REQUEST_ID" },
      { status: 400 }
    );
  }

  const request = await prisma.workEntryEditRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: {
          id: true,
          isActive: true,
          companyId: true,
          language: true,
          company: {
            select: {
              subdomain: true,
            },
          },
        },
      },
      workEntry: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!request) {
    return NextResponse.json(
      { ok: false, error: "REQUEST_NOT_FOUND" },
      { status: 404 }
    );
  }

  const employeeLanguage = normalizeAppUiLanguage(request.user.language);
  const t = (key: keyof typeof TIME_ENTRY_CORRECTION_API_TEXTS) =>
    translate(employeeLanguage, key, TIME_ENTRY_CORRECTION_API_TEXTS);

  if (request.user.companyId !== admin.companyId) {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  if (!request.user.isActive) {
    return NextResponse.json(
      { ok: false, error: t("employeeInactive") },
      { status: 409 }
    );
  }

  if (request.status !== WorkEntryEditRequestStatus.PENDING) {
    return NextResponse.json(
      { ok: false, error: t("onlyPendingCanBeRejected") },
      { status: 409 }
    );
  }

  const updated = await prisma.workEntryEditRequest.update({
    where: { id: request.id },
    data: {
      status: WorkEntryEditRequestStatus.REJECTED,
      decidedAt: new Date(),
      decidedById: admin.id,
    },
  });

  await sendPushToUser(request.userId, {
    companyId: admin.companyId,
    companySubdomain: request.user.company.subdomain,
    title: t("workEntryEditRequestRejectedPushTitle"),
    body: t("workEntryEditRequestRejectedPushBody"),
    url: buildPushUrl(`/erfassung?entryId=${encodeURIComponent(request.workEntry.id)}`),
  });

  return NextResponse.json({
    ok: true,
    request: {
      id: request.id,
      status: updated.status,
      decidedAt: updated.decidedAt?.toISOString() ?? null,
      decidedBy: {
        id: admin.id,
        fullName: admin.fullName,
      },
    },
  });
}