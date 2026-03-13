import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { berlinTodayYMD, getMissingRequiredWorkDates } from "@/lib/timesheetLock";

type MissingWorkEntryAlert = {
  count: number;
  oldestMissingDate: string;
  newestMissingDate: string;
} | null;

export async function GET(req: Request): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");

  const todayYMD = berlinTodayYMD();

  const [tasks, missingDates] = await Promise.all([
    prisma.task.findMany({
      where: {
        assignedToUserId: session.userId,
        ...(statusParam === "OPEN"
          ? { status: "OPEN" }
          : statusParam === "COMPLETED"
            ? { status: "COMPLETED" }
            : {}),
      },
      orderBy: [
        { status: "asc" },
        { referenceDate: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        createdByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
        completedByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    }),
    getMissingRequiredWorkDates(session.userId, todayYMD, {
      includeUntilDate: true,
    }),
  ]);

  const missingWorkEntryAlert: MissingWorkEntryAlert =
    missingDates.length > 0
      ? {
          count: missingDates.length,
          oldestMissingDate: missingDates[0],
          newestMissingDate: missingDates[missingDates.length - 1],
        }
      : null;

  return NextResponse.json({ tasks, missingWorkEntryAlert });
}