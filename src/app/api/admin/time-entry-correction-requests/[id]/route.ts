import { NextResponse } from "next/server";
import { TimeEntryCorrectionRequestStatus } from "@prisma/client";
import {
  normalizeAppUiLanguage,
  TIME_ENTRY_CORRECTION_API_TEXTS,
  translate,
} from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_req: Request, context: RouteContext) {
  const admin = await requireAdmin();
  const adminUser = admin
    ? await prisma.appUser.findUnique({
        where: { id: admin.id },
        select: { language: true },
      })
    : null;
  const language = normalizeAppUiLanguage(adminUser?.language);
  const t = (key: keyof typeof TIME_ENTRY_CORRECTION_API_TEXTS) =>
    translate(language, key, TIME_ENTRY_CORRECTION_API_TEXTS);

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
      { ok: false, error: t("missingRequestId") },
      { status: 400 }
    );
  }

  const existing = await prisma.timeEntryCorrectionRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
      user: {
        select: {
          companyId: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: t("correctionRequestNotFound") },
      { status: 404 }
    );
  }

  if (existing.user.companyId !== admin.companyId) {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  await prisma.timeEntryCorrectionRequest.delete({
    where: { id: requestId },
  });

  return NextResponse.json({
    ok: true,
    deletedId: existing.id,
    hadApprovedStatus: existing.status === TimeEntryCorrectionRequestStatus.APPROVED,
  });
}