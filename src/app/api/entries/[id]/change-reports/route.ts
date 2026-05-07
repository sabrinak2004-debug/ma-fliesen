import { NextResponse } from "next/server";
import { Prisma, Role, WorkEntryChangeAction } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ChangeReportDTO = {
  id: string;
  action: WorkEntryChangeAction;
  reason: string;
  createdAt: string;
  changedBy: {
    id: string;
    fullName: string;
  };
  oldValues: Prisma.JsonValue;
  newValues: Prisma.JsonValue | null;
};

export async function GET(
  _req: Request,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const { id } = await context.params;

  const entry = await prisma.workEntry.findFirst({
    where: {
      id,
      user: {
        companyId: session.companyId,
        ...(session.role === Role.ADMIN ? {} : { id: session.userId }),
      },
    },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!entry) {
    return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 404 });
  }

  const reports = await prisma.workEntryChangeReport.findMany({
    where: {
      workEntryId: entry.id,
      targetUser: {
        companyId: session.companyId,
      },
      ...(session.role === Role.ADMIN ? {} : { targetUserId: session.userId }),
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      changedByUser: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  const result: ChangeReportDTO[] = reports.map((report) => ({
    id: report.id,
    action: report.action,
    reason: report.reason,
    createdAt: report.createdAt.toISOString(),
    changedBy: {
      id: report.changedByUser.id,
      fullName: report.changedByUser.fullName,
    },
    oldValues: report.oldValues,
    newValues: report.newValues,
  }));

  return NextResponse.json({ reports: result });
}