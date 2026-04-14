// src/app/api/admin/dashboard/remind-missing/route.ts
import { NextResponse } from "next/server";
import { Role, TaskCategory, TaskRequiredAction, TaskStatus } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/webpush";
import { berlinTodayYMD, getMissingRequiredWorkDates } from "@/lib/timesheetLock";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function dateOnlyUTC(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ ok: false, error: "Nicht eingeloggt." }, { status: 401 });
  }

  if (session.role !== Role.ADMIN) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ungültiger Body." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ ok: false, error: "Ungültiger Body." }, { status: 400 });
  }

  const userId = getString(body["userId"]).trim();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Mitarbeiter-ID fehlt." }, { status: 400 });
  }

  const employee = await prisma.appUser.findFirst({
    where: {
      id: userId,
      role: Role.EMPLOYEE,
      isActive: true,
      companyId: session.companyId,
    },
    select: {
      id: true,
      fullName: true,
    },
  });

  if (!employee) {
    return NextResponse.json({ ok: false, error: "Mitarbeiter nicht gefunden." }, { status: 404 });
  }
  const todayYMD = berlinTodayYMD();
  const missingDates = await getMissingRequiredWorkDates(employee.id, todayYMD);

  if (missingDates.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Für diesen Mitarbeiter gibt es aktuell keine überfälligen fehlenden Arbeitseinträge." },
      { status: 409 }
    );
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
    const createdTask = await prisma.task.create({
      data: {
        assignedToUserId: employee.id,
        createdByUserId: session.userId,
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

  const tenantIcon192 = `/tenant-assets/${session.companySubdomain}/icon-192.jpeg`;
  const tenantBadge = `/tenant-assets/${session.companySubdomain}/apple-touch-icon.png`;

  const sentCount = await sendPushToUser(employee.id, {
    companyId: session.companyId,
    companySubdomain: session.companySubdomain,
    title: "Erinnerung fehlende Arbeitseinträge",
    body: `Dir fehlen noch Arbeitseinträge für ${rangeLabel}. Bitte prüfe deine Aufgaben und trage zuerst den ältesten fehlenden Tag nach.`,
    url: "/aufgaben",
    icon: tenantIcon192,
    badge: tenantBadge,
  });

  if (sentCount === 0) {
    return NextResponse.json(
      { ok: false, error: "Für diesen Mitarbeiter ist keine aktive Push-Subscription vorhanden." },
      { status: 409 }
    );
  }

  return NextResponse.json({
    ok: true,
    userId: employee.id,
    fullName: employee.fullName,
    sentCount,
    missingDatesCount: missingDates.length,
    oldestMissingDate,
    newestMissingDate,
    referenceDate,
    taskCreated: Boolean(createdTaskId),
    taskId: createdTaskId,
  });
}