import { NextResponse } from "next/server";
import {
  AbsenceRequestStatus,
  TaskRequiredAction,
  TaskStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendPushToAdmins } from "@/lib/webpush";

type Params = {
  params: Promise<{
    taskId: string;
  }>;
};

function toIsoDateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDayUTC(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

function nextDayUTC(yyyyMmDd: string): Date {
  const d = startOfDayUTC(yyyyMmDd);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

async function hasRequiredActionBeenFulfilled(
  userId: string,
  requiredAction: TaskRequiredAction,
  referenceDate: Date | null
): Promise<boolean> {
  if (requiredAction === "NONE") {
    return true;
  }

  if (!referenceDate) {
    return false;
  }

  const referenceDateYmd = toIsoDateUTC(referenceDate);
  const dayStart = startOfDayUTC(referenceDateYmd);
  const dayEndExclusive = nextDayUTC(referenceDateYmd);

  if (requiredAction === "WORK_ENTRY_FOR_DATE") {
    const workEntry = await prisma.workEntry.findFirst({
      where: {
        userId,
        workDate: {
          gte: dayStart,
          lt: dayEndExclusive,
        },
      },
      select: {
        id: true,
      },
    });

    return Boolean(workEntry);
  }

  if (requiredAction === "VACATION_ENTRY_FOR_DATE") {
    const [absence, request] = await Promise.all([
      prisma.absence.findFirst({
        where: {
          userId,
          type: "VACATION",
          absenceDate: {
            gte: dayStart,
            lt: dayEndExclusive,
          },
        },
        select: {
          id: true,
        },
      }),
      prisma.absenceRequest.findFirst({
        where: {
          userId,
          type: "VACATION",
          status: {
            in: [AbsenceRequestStatus.PENDING, AbsenceRequestStatus.APPROVED],
          },
          startDate: {
            lte: dayStart,
          },
          endDate: {
            gte: dayStart,
          },
        },
        select: {
          id: true,
        },
      }),
    ]);

    return Boolean(absence || request);
  }

  if (requiredAction === "SICK_ENTRY_FOR_DATE") {
    const [absence, request] = await Promise.all([
      prisma.absence.findFirst({
        where: {
          userId,
          type: "SICK",
          absenceDate: {
            gte: dayStart,
            lt: dayEndExclusive,
          },
        },
        select: {
          id: true,
        },
      }),
      prisma.absenceRequest.findFirst({
        where: {
          userId,
          type: "SICK",
          status: {
            in: [AbsenceRequestStatus.PENDING, AbsenceRequestStatus.APPROVED],
          },
          startDate: {
            lte: dayStart,
          },
          endDate: {
            gte: dayStart,
          },
        },
        select: {
          id: true,
        },
      }),
    ]);

    return Boolean(absence || request);
  }

  return false;
}

export async function POST(
  _req: Request,
  context: Params
): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const { taskId } = await context.params;

  const existingTask = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignedToUser: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  if (!existingTask) {
    return NextResponse.json({ error: "Aufgabe nicht gefunden." }, { status: 404 });
  }

  if (existingTask.assignedToUserId !== session.userId) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  if (existingTask.status === TaskStatus.COMPLETED) {
    return NextResponse.json(
      { error: "Aufgabe ist bereits erledigt." },
      { status: 400 }
    );
  }

  const actionFulfilled = await hasRequiredActionBeenFulfilled(
    existingTask.assignedToUserId,
    existingTask.requiredAction,
    existingTask.referenceDate
  );

  if (!actionFulfilled) {
    const referenceDateLabel = existingTask.referenceDate
      ? toIsoDateUTC(existingTask.referenceDate)
      : "ohne Datum";

    return NextResponse.json(
      {
        error:
          existingTask.requiredAction === "WORK_ENTRY_FOR_DATE"
            ? `Die Aufgabe kann erst erledigt werden, wenn für ${referenceDateLabel} ein Arbeitszeiteintrag vorhanden ist.`
            : existingTask.requiredAction === "VACATION_ENTRY_FOR_DATE"
            ? `Die Aufgabe kann erst erledigt werden, wenn für ${referenceDateLabel} ein Urlaubseintrag oder ein passender Urlaubsantrag vorhanden ist.`
            : existingTask.requiredAction === "SICK_ENTRY_FOR_DATE"
            ? `Die Aufgabe kann erst erledigt werden, wenn für ${referenceDateLabel} ein Krankheitseintrag oder ein passender Krankheitsantrag vorhanden ist.`
            : "Die geforderte Aktion wurde noch nicht erfüllt.",
      },
      { status: 400 }
    );
  }

  const task = await prisma.task.update({
    where: { id: existingTask.id },
    data: {
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
      completedByUserId: session.userId,
    },
    include: {
      assignedToUser: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  await sendPushToAdmins({
    title: "Aufgabe erledigt",
    body: `${task.assignedToUser.fullName}: ${task.title}`,
    url: "/admin/tasks",
  });

  return NextResponse.json({ task });
}