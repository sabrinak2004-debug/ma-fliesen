import { NextResponse } from "next/server";
import { TimeEntryCorrectionRequestStatus } from "@prisma/client";
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

  const existing = await prisma.timeEntryCorrectionRequest.findUnique({
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
      { ok: false, error: "REQUEST_NOT_FOUND" },
      { status: 404 }
    );
  }

  const employeeLanguage = normalizeAppUiLanguage(existing.user.language);
  const t = (key: keyof typeof TIME_ENTRY_CORRECTION_API_TEXTS) =>
    translate(employeeLanguage, key, TIME_ENTRY_CORRECTION_API_TEXTS);

  if (existing.user.companyId !== admin.companyId) {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  if (!existing.user.isActive) {
    return NextResponse.json(
      { ok: false, error: t("employeeInactive") },
      { status: 409 }
    );
  }

  if (existing.status !== TimeEntryCorrectionRequestStatus.PENDING) {
    return NextResponse.json(
      { ok: false, error: t("onlyPendingCanBeRejected") },
      { status: 409 }
    );
  }

  const updated = await prisma.timeEntryCorrectionRequest.update({
    where: { id: existing.id },
    data: {
      status: TimeEntryCorrectionRequestStatus.REJECTED,
      decidedAt: new Date(),
      decidedById: admin.id,
    },
  });

  await sendPushToUser(existing.userId, {
    title: t("rejectedPushTitle"),
    body: t("rejectedPushBody"),
    url: buildPushUrl(
      `/erfassung?syncDate=${encodeURIComponent(existing.startDate.toISOString().slice(0, 10))}`
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
      startDate: existing.startDate.toISOString(),
      endDate: existing.endDate.toISOString(),
    },
  });
}