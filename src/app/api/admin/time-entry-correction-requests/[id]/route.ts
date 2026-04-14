import { NextResponse } from "next/server";
import { TimeEntryCorrectionRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_req: Request, context: RouteContext) {
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
      { ok: false, error: "Nachtragsanfrage nicht gefunden." },
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