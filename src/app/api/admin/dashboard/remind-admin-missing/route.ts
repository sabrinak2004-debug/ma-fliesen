// src/app/api/admin/dashboard/remind-admin-missing/route.ts
import { NextResponse } from "next/server";
import { Role, TaskCategory, TaskRequiredAction, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/webpush";
import { berlinHour, berlinTodayYMD, getMissingRequiredWorkDates } from "@/lib/timesheetLock";

function dateOnlyUTC(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = req.headers.get("authorization") ?? "";
  const expected = cronSecret ? `Bearer ${cronSecret}` : "";

  if (!cronSecret || authorization !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const berlinCurrentHour = berlinHour();
  if (berlinCurrentHour < 18) {
    return NextResponse.json({
      ok: true,
      sent: false,
      reason: "Vor 18:00 Uhr Berlin-Zeit werden keine Mitarbeiter-Erinnerungen gesendet.",
    });
  }

  const todayYMD = berlinTodayYMD();

  const employees = await prisma.appUser.findMany({
    where: {
      role: Role.EMPLOYEE,
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
    },
    orderBy: {
      fullName: "asc",
    },
  });

  const results = await Promise.all(
    employees.map(async (employee) => {
      const missingDates = await getMissingRequiredWorkDates(employee.id, todayYMD);

      if (missingDates.length === 0) {
        return {
          userId: employee.id,
          fullName: employee.fullName,
          missingDatesCount: 0,
          oldestMissingDate: null,
          sentCount: 0,
        };
      }

      if (missingDates.length < 5) {
        return {
          userId: employee.id,
          fullName: employee.fullName,
          missingDatesCount: missingDates.length,
          oldestMissingDate: missingDates[0],
          sentCount: 0,
        };
      }

      const oldestMissingDate = missingDates[0];
      const newestMissingDate = missingDates[missingDates.length - 1];
      const rangeLabel =
        oldestMissingDate === newestMissingDate
          ? oldestMissingDate
          : `${oldestMissingDate} bis ${newestMissingDate}`;

      const referenceDate = oldestMissingDate;

      const existingTask = await prisma.task.findFirst({
        where: {
          assignedToUserId: employee.id,
          category: TaskCategory.WORK_TIME,
          status: TaskStatus.OPEN,
          requiredAction: TaskRequiredAction.WORK_ENTRY_FOR_DATE,
          referenceDate: dateOnlyUTC(referenceDate),
        },
        select: {
          id: true,
        },
      });

      let createdTaskId: string | null = null;

      if (!existingTask) {
        const systemAdmin = await prisma.appUser.findFirst({
          where: {
            role: Role.ADMIN,
            isActive: true,
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
          },
        });

        if (systemAdmin) {
          const createdTask = await prisma.task.create({
            data: {
              assignedToUserId: employee.id,
              createdByUserId: systemAdmin.id,
              title:
                missingDates.length === 1
                  ? `Arbeitszeit für ${referenceDate} nachtragen`
                  : `Arbeitszeiten ab ${referenceDate} nachtragen`,
              description:
                missingDates.length === 1
                  ? `Bitte trage deine fehlende Arbeitszeit für ${referenceDate} in der App nach.`
                  : `Dir fehlen Arbeitszeiteinträge für mehrere Tage (${rangeLabel}). Bitte beginne mit dem ältesten offenen Tag ${referenceDate}.`,
              category: TaskCategory.WORK_TIME,
              status: TaskStatus.OPEN,
              requiredAction: TaskRequiredAction.WORK_ENTRY_FOR_DATE,
              referenceDate: dateOnlyUTC(referenceDate),
            },
            select: {
              id: true,
            },
          });

          createdTaskId = createdTask.id;
        }
      }

      const sentCount = await sendPushToUser(employee.id, {
        title: "Fehlende Arbeitseinträge",
        body: `Dir fehlen noch Arbeitseinträge für ${rangeLabel}. Bitte öffne deine Aufgaben und beginne mit dem ältesten fehlenden Tag.`,
        url: "/aufgaben",
      });

      return {
        userId: employee.id,
        fullName: employee.fullName,
        missingDatesCount: missingDates.length,
        oldestMissingDate,
        sentCount,
        referenceDate,
        taskCreated: Boolean(createdTaskId),
      };
    })
  );

  const notifiedEmployees = results.filter((item) => item.sentCount > 0);

  return NextResponse.json({
    ok: true,
    sent: notifiedEmployees.length > 0,
    sentCount: notifiedEmployees.reduce((sum, item) => sum + item.sentCount, 0),
    notifiedEmployeesCount: notifiedEmployees.length,
    notifiedEmployees: notifiedEmployees.map((item) => ({
      userId: item.userId,
      fullName: item.fullName,
      missingDatesCount: item.missingDatesCount,
      oldestMissingDate: item.oldestMissingDate,
      referenceDate: item.referenceDate,
      taskCreated: item.taskCreated,
    })),
  });
}