import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { berlinTodayYMD, getMissingRequiredWorkDates } from "@/lib/timesheetLock";

type MissingWorkEntryAlert = {
  count: number;
  oldestMissingDate: string;
  newestMissingDate: string;
} | null;

function shouldKeepTask(args: {
  task: {
    status: string;
    category: string;
    requiredAction: string;
    referenceDate: Date | null;
  };
  missingDateSet: ReadonlySet<string>;
}): boolean {
  const { task, missingDateSet } = args;

  if (task.status !== "OPEN") {
    return true;
  }

  if (
    task.category === "WORK_TIME" &&
    task.requiredAction === "WORK_ENTRY_FOR_DATE" &&
    task.referenceDate
  ) {
    const referenceDateYMD = task.referenceDate.toISOString().slice(0, 10);
    return missingDateSet.has(referenceDateYMD);
  }

  return true;
}

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
        assignedToUser: {
          companyId: session.companyId,
        },
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
      companyId: session.companyId,
    }),
  ]);

  const missingDateSet = new Set<string>(missingDates);

  const visibleTasks = tasks.filter((task) =>
    shouldKeepTask({
      task: {
        status: task.status,
        category: task.category,
        requiredAction: task.requiredAction,
        referenceDate: task.referenceDate,
      },
      missingDateSet,
    })
  );

  const missingWorkEntryAlert: MissingWorkEntryAlert =
    missingDates.length > 0
      ? {
          count: missingDates.length,
          oldestMissingDate: missingDates[0],
          newestMissingDate: missingDates[missingDates.length - 1],
        }
      : null;

  return NextResponse.json({ tasks: visibleTasks, missingWorkEntryAlert });
}