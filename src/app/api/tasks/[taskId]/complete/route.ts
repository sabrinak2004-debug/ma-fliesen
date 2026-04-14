import { NextResponse } from "next/server";
import {
  AbsenceRequestStatus,
  TaskRequiredAction,
  TaskStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendPushToAdmins } from "@/lib/webpush";
import {
  ADMIN_TASKS_UI_TEXTS,
  translate,
  type AppUiLanguage,
  type AdminTasksTextKey,
} from "@/lib/i18n";

type Params = {
  params: Promise<{
    taskId: string;
  }>;
};

function translateAdminTaskText(
  language: AppUiLanguage,
  key: AdminTasksTextKey
): string {
  return translate(language, key, ADMIN_TASKS_UI_TEXTS);
}

function replaceTemplate(
  template: string,
  values: Record<string, string>
): string {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, value);
  }, template);
}

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

function addUtcDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function getTaskReferenceRange(args: {
  referenceDate: Date | null;
  referenceStartDate: Date | null;
  referenceEndDate: Date | null;
}): { startDate: Date; endDate: Date } | null {
  const startDate = args.referenceStartDate ?? args.referenceDate;
  const endDate = args.referenceEndDate ?? args.referenceStartDate ?? args.referenceDate;

  if (!startDate || !endDate) {
    return null;
  }

  return {
    startDate,
    endDate,
  };
}

async function hasRequiredActionBeenFulfilled(
  userId: string,
  requiredAction: TaskRequiredAction,
  referenceDate: Date | null,
  referenceStartDate: Date | null,
  referenceEndDate: Date | null
): Promise<boolean> {
  if (requiredAction === "NONE") {
    return true;
  }

  const range = getTaskReferenceRange({
    referenceDate,
    referenceStartDate,
    referenceEndDate,
  });

  if (!range) {
    return false;
  }

  const rangeStartYmd = toIsoDateUTC(range.startDate);
  const rangeEndYmd = toIsoDateUTC(range.endDate);

  if (requiredAction === "WORK_ENTRY_FOR_DATE") {
    for (
      let current = startOfDayUTC(rangeStartYmd);
      current <= startOfDayUTC(rangeEndYmd);
      current = addUtcDays(current, 1)
    ) {
      const nextDay = addUtcDays(current, 1);

      const workEntry = await prisma.workEntry.findFirst({
        where: {
          userId,
          workDate: {
            gte: current,
            lt: nextDay,
          },
        },
        select: {
          id: true,
        },
      });

      if (!workEntry) {
        return false;
      }
    }

    return true;
  }

  if (requiredAction === "VACATION_ENTRY_FOR_DATE") {
    for (
      let current = startOfDayUTC(rangeStartYmd);
      current <= startOfDayUTC(rangeEndYmd);
      current = addUtcDays(current, 1)
    ) {
      const nextDay = addUtcDays(current, 1);

      const [absence, request] = await Promise.all([
        prisma.absence.findFirst({
          where: {
            userId,
            type: "VACATION",
            absenceDate: {
              gte: current,
              lt: nextDay,
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
              lte: current,
            },
            endDate: {
              gte: current,
            },
          },
          select: {
            id: true,
          },
        }),
      ]);

      if (!absence && !request) {
        return false;
      }
    }

    return true;
  }

  if (requiredAction === "SICK_ENTRY_FOR_DATE") {
    for (
      let current = startOfDayUTC(rangeStartYmd);
      current <= startOfDayUTC(rangeEndYmd);
      current = addUtcDays(current, 1)
    ) {
      const nextDay = addUtcDays(current, 1);

      const [absence, request] = await Promise.all([
        prisma.absence.findFirst({
          where: {
            userId,
            type: "SICK",
            absenceDate: {
              gte: current,
              lt: nextDay,
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
              lte: current,
            },
            endDate: {
              gte: current,
            },
          },
          select: {
            id: true,
          },
        }),
      ]);

      if (!absence && !request) {
        return false;
      }
    }

    return true;
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

  const language: AppUiLanguage =
    session.language === "DE" ||
    session.language === "EN" ||
    session.language === "IT" ||
    session.language === "TR" ||
    session.language === "SQ" ||
    session.language === "KU"
      ? session.language
      : "DE";

  const { taskId } = await context.params;

  const existingTask = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignedToUser: {
        select: {
          id: true,
          fullName: true,
          companyId: true,
        },
      },
    },
  });

  if (!existingTask) {
    return NextResponse.json(
      { error: translateAdminTaskText(language, "taskNotFound") },
      { status: 404 }
    );
  }

  if (existingTask.assignedToUser.companyId !== session.companyId) {
    return NextResponse.json(
      { error: translateAdminTaskText(language, "noAccess") },
      { status: 403 }
    );
  }

  if (existingTask.assignedToUserId !== session.userId) {
    return NextResponse.json(
      { error: translateAdminTaskText(language, "noAccess") },
      { status: 403 }
    );
  }

  if (existingTask.status === TaskStatus.COMPLETED) {
    return NextResponse.json(
      { error: translateAdminTaskText(language, "taskAlreadyCompleted") },
      { status: 400 }
    );
  }

  const actionFulfilled = await hasRequiredActionBeenFulfilled(
    existingTask.assignedToUserId,
    existingTask.requiredAction,
    existingTask.referenceDate,
    existingTask.referenceStartDate,
    existingTask.referenceEndDate
  );

  if (!actionFulfilled) {
    const range = getTaskReferenceRange({
      referenceDate: existingTask.referenceDate,
      referenceStartDate: existingTask.referenceStartDate,
      referenceEndDate: existingTask.referenceEndDate,
    });

    const referenceLabel = !range
      ? translateAdminTaskText(language, "referenceWithoutDate")
      : toIsoDateUTC(range.startDate) === toIsoDateUTC(range.endDate)
      ? toIsoDateUTC(range.startDate)
      : `${toIsoDateUTC(range.startDate)} ${translateAdminTaskText(language, "until")} ${toIsoDateUTC(range.endDate)}`;

    const error =
      existingTask.requiredAction === "WORK_ENTRY_FOR_DATE"
        ? replaceTemplate(
            translateAdminTaskText(language, "taskCompleteRequirementWorkTime"),
            { referenceLabel }
          )
        : existingTask.requiredAction === "VACATION_ENTRY_FOR_DATE"
        ? replaceTemplate(
            translateAdminTaskText(language, "taskCompleteRequirementVacation"),
            { referenceLabel }
          )
        : existingTask.requiredAction === "SICK_ENTRY_FOR_DATE"
        ? replaceTemplate(
            translateAdminTaskText(language, "taskCompleteRequirementSickness"),
            { referenceLabel }
          )
        : translateAdminTaskText(language, "taskCompleteRequirementGeneric");

    return NextResponse.json(
      { error },
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
    companyId: session.companyId,
    title: translateAdminTaskText(language, "taskCompletedPushTitle"),
    body: `${task.assignedToUser.fullName}: ${task.title}`,
    url: "/admin/tasks",
  });

  return NextResponse.json({
  task: {
    ...task,
    title: task.titleTranslations && typeof task.titleTranslations === "object"
      ? (task.titleTranslations as Record<string, unknown>)[session.language] && typeof (task.titleTranslations as Record<string, unknown>)[session.language] === "string"
        ? ((task.titleTranslations as Record<string, string>)[session.language] ?? task.title)
        : task.title
      : task.title,
    description: task.descriptionTranslations && typeof task.descriptionTranslations === "object"
      ? (task.descriptionTranslations as Record<string, unknown>)[session.language] && typeof (task.descriptionTranslations as Record<string, unknown>)[session.language] === "string"
        ? ((task.descriptionTranslations as Record<string, string>)[session.language] ?? task.description)
        : task.description
      : task.description,
  },
});
}