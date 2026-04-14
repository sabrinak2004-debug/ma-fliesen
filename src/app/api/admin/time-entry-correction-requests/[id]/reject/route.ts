import { NextResponse } from "next/server";
import { TimeEntryCorrectionRequestStatus } from "@prisma/client";
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
      { ok: false, error: "Fehlende Request-ID." },
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
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "Antrag nicht gefunden." },
      { status: 404 }
    );
  }

  if (existing.user.companyId !== admin.companyId) {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  if (!existing.user.isActive) {
    return NextResponse.json(
      { ok: false, error: "Mitarbeiter ist nicht aktiv." },
      { status: 409 }
    );
  }

  if (existing.status !== TimeEntryCorrectionRequestStatus.PENDING) {
    return NextResponse.json(
      { ok: false, error: "Nur offene Anträge können abgelehnt werden." },
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
    title: "Nachtragsantrag abgelehnt",
    body: "Dein Nachtragsantrag wurde abgelehnt.",
    url: buildPushUrl(`/erfassung?syncDate=${encodeURIComponent(existing.startDate.toISOString().slice(0, 10))}`),
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