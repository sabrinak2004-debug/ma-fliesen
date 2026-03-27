import { NextResponse } from "next/server";
import { AbsenceRequestStatus } from "@prisma/client";
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
    return NextResponse.json({ ok: false, error: "Keine Berechtigung." }, { status: 403 });
  }

  const params = await context.params;
  const requestId = params.id.trim();

  if (!requestId) {
    return NextResponse.json({ ok: false, error: "Fehlende Request-ID." }, { status: 400 });
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
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ ok: false, error: "Antrag nicht gefunden." }, { status: 404 });
  }

  if (existing.user.companyId !== admin.companyId) {
    return NextResponse.json({ ok: false, error: "Keine Berechtigung." }, { status: 403 });
  }

  if (!existing.user.isActive) {
    return NextResponse.json({ ok: false, error: "Mitarbeiter ist nicht aktiv." }, { status: 409 });
  }

  if (existing.status !== AbsenceRequestStatus.PENDING) {
    return NextResponse.json({ ok: false, error: "Nur offene Anträge können abgelehnt werden." }, { status: 409 });
  }

  const updated = await prisma.absenceRequest.update({
    where: { id: existing.id },
    data: {
      status: AbsenceRequestStatus.REJECTED,
      decidedAt: new Date(),
      decidedById: admin.id,
    },
  });

  const typeLabel = existing.type === "VACATION" ? "Urlaubsantrag" : "Krankheitsantrag";

  await sendPushToUser(existing.userId, {
    title: "Antrag abgelehnt",
    body: `Dein ${typeLabel.toLowerCase()} wurde abgelehnt.`,
    url: buildPushUrl("/kalender"),
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