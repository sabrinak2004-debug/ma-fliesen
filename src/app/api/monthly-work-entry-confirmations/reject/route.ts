import { NextResponse } from "next/server";
import {
  AbsenceTimeMode,
  AbsenceType,
  MonthlyWorkEntryConfirmationStatus,
  Role,
  SickLeaveKind,
  TaskCategory,
  TaskRequiredAction,
  TaskStatus,
} from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildPushUrl, sendPushToUser } from "@/lib/webpush";
import { type AppUiLanguage, normalizeAppUiLanguage } from "@/lib/i18n";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getNumber(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) ? value : 0;
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function dateOnlyUTC(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

function toIsoDateUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toHHMMUTC(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getMonthRange(year: number, month: number): {
  start: Date;
  endExclusive: Date;
  startYMD: string;
  endYMD: string;
} {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const endExclusive = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));

  return {
    start,
    endExclusive,
    startYMD: toIsoDateUTC(start),
    endYMD: toIsoDateUTC(lastDay),
  };
}

function berlinDueAtToday2200(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return new Date(`${year}-${month}-${day}T22:00:00.000+02:00`);
}

function formatMonthLabel(language: AppUiLanguage, year: number, month: number): string {
  const monthText = String(month).padStart(2, "0");

  switch (language) {
    case "EN":
      return `${monthText}/${year}`;
    case "IT":
    case "TR":
    case "SQ":
    case "KU":
    case "RO":
    case "DE":
    default:
      return `${monthText}.${year}`;
  }
}

function getTaskTitle(language: AppUiLanguage, monthLabel: string): string {
  switch (language) {
    case "EN":
      return `Confirm work entries for ${monthLabel}`;
    case "IT":
      return `Conferma le registrazioni di lavoro per ${monthLabel}`;
    case "TR":
      return `${monthLabel} çalışma kayıtlarını onayla`;
    case "SQ":
      return `Konfirmo regjistrimet e punës për ${monthLabel}`;
    case "KU":
      return `Tomarên karê ji bo ${monthLabel} piştrast bike`;
    case "RO":
      return `Confirmați înregistrările de lucru pentru ${monthLabel}`;
    case "DE":
    default:
      return `Arbeitszeiten für ${monthLabel} bestätigen`;
  }
}

function getTaskDescription(language: AppUiLanguage, monthLabel: string): string {
  switch (language) {
    case "EN":
      return `You rejected the monthly confirmation for ${monthLabel}. Please check your work entries again and confirm them by 22:00 today.`;
    case "IT":
      return `Hai rifiutato la conferma mensile per ${monthLabel}. Controlla di nuovo le tue registrazioni e confermale entro le 22:00 di oggi.`;
    case "TR":
      return `${monthLabel} aylık onayını reddettiniz. Lütfen çalışma kayıtlarınızı tekrar kontrol edin ve bugün saat 22:00'ye kadar onaylayın.`;
    case "SQ":
      return `Ju refuzuat konfirmimin mujor për ${monthLabel}. Ju lutem kontrolloni përsëri regjistrimet dhe konfirmojini deri sot në orën 22:00.`;
    case "KU":
      return `Te piştrastkirina mehane ya ${monthLabel} red kir. Ji kerema xwe tomarên karê xwe dîsa kontrol bike û heta îro saet 22:00 piştrast bike.`;
    case "RO":
      return `Ați respins confirmarea lunară pentru ${monthLabel}. Vă rugăm să verificați din nou înregistrările și să le confirmați astăzi până la ora 22:00.`;
    case "DE":
    default:
      return `Du hast die Monatsbestätigung für ${monthLabel} abgelehnt. Bitte prüfe deine Arbeitszeiten erneut und bestätige sie spätestens heute bis 22:00 Uhr.`;
  }
}

function getPushTitle(language: AppUiLanguage): string {
  switch (language) {
    case "EN":
      return "Work entries still need confirmation";
    case "IT":
      return "Le registrazioni devono ancora essere confermate";
    case "TR":
      return "Çalışma kayıtları hâlâ onaylanmalı";
    case "SQ":
      return "Regjistrimet e punës duhet ende të konfirmohen";
    case "KU":
      return "Tomarên karê hîn divê bêne piştrastkirin";
    case "RO":
      return "Înregistrările de lucru trebuie confirmate";
    case "DE":
    default:
      return "Arbeitszeiten müssen noch bestätigt werden";
  }
}

function getPushBody(language: AppUiLanguage, monthLabel: string): string {
  switch (language) {
    case "EN":
      return `Please confirm your work entries for ${monthLabel} by 22:00 today.`;
    case "IT":
      return `Conferma le registrazioni di lavoro per ${monthLabel} entro le 22:00 di oggi.`;
    case "TR":
      return `${monthLabel} çalışma kayıtlarınızı bugün saat 22:00'ye kadar onaylayın.`;
    case "SQ":
      return `Konfirmoni regjistrimet e punës për ${monthLabel} deri sot në orën 22:00.`;
    case "KU":
      return `Ji kerema xwe tomarên karê ji bo ${monthLabel} heta îro saet 22:00 piştrast bike.`;
    case "RO":
      return `Vă rugăm să confirmați înregistrările de lucru pentru ${monthLabel} astăzi până la ora 22:00.`;
    case "DE":
    default:
      return `Bitte bestätige deine Arbeitszeiten für ${monthLabel} spätestens heute bis 22:00 Uhr.`;
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json({ ok: false, error: "NOT_LOGGED_IN" }, { status: 401 });
  }

  if (session.role !== Role.EMPLOYEE) {
    return NextResponse.json({ ok: false, error: "ONLY_EMPLOYEES" }, { status: 403 });
  }

  const body: unknown = await req.json().catch(() => null);

  if (!isRecord(body)) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const year = getNumber(body["year"]);
  const month = getNumber(body["month"]);
  const rejectionReason = getString(body["rejectionReason"]).trim();

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ ok: false, error: "INVALID_MONTH" }, { status: 400 });
  }

  if (!rejectionReason) {
    return NextResponse.json({ ok: false, error: "REJECTION_REASON_REQUIRED" }, { status: 400 });
  }

  const range = getMonthRange(year, month);
  const dueAt = berlinDueAtToday2200();
  const language = normalizeAppUiLanguage(session.language);
  const monthLabel = formatMonthLabel(language, year, month);

  const entries = await prisma.workEntry.findMany({
    where: {
      userId: session.userId,
      workDate: {
        gte: range.start,
        lt: range.endExclusive,
      },
    },
    orderBy: [{ workDate: "asc" }, { startTime: "asc" }],
    select: {
      id: true,
      workDate: true,
      startTime: true,
      endTime: true,
      activity: true,
      location: true,
      travelMinutes: true,
      grossMinutes: true,
      breakMinutes: true,
      workMinutes: true,
      noteEmployee: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const doctorAppointmentRows = await prisma.absence.findMany({
    where: {
      userId: session.userId,
      type: AbsenceType.SICK,
      sickLeaveKind: SickLeaveKind.DOCTOR_APPOINTMENT,
      timeMode: AbsenceTimeMode.TIME_RANGE,
      absenceDate: {
        gte: range.start,
        lt: range.endExclusive,
      },
    },
    orderBy: [{ absenceDate: "asc" }, { startTime: "asc" }],
    select: {
      id: true,
      absenceDate: true,
      startTime: true,
      endTime: true,
      paidMinutes: true,
      createdAt: true,
    },
  });

  const workEntrySnapshot = entries.map((entry) => ({
    id: entry.id,
    kind: "WORK_ENTRY",
    workDate: toIsoDateUTC(entry.workDate),
    startTime: toHHMMUTC(entry.startTime),
    endTime: toHHMMUTC(entry.endTime),
    activity: entry.activity,
    location: entry.location,
    travelMinutes: entry.travelMinutes,
    grossMinutes: entry.grossMinutes,
    breakMinutes: entry.breakMinutes,
    workMinutes: entry.workMinutes,
    noteEmployee: entry.noteEmployee ?? "",
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  }));

  const doctorAppointmentSnapshot = doctorAppointmentRows
    .filter((appointment) => appointment.startTime && appointment.endTime && appointment.paidMinutes > 0)
    .map((appointment) => ({
      id: appointment.id,
      kind: "DOCTOR_APPOINTMENT",
      workDate: toIsoDateUTC(appointment.absenceDate),
      startTime: toHHMMUTC(appointment.startTime ?? new Date("1970-01-01T00:00:00.000Z")),
      endTime: toHHMMUTC(appointment.endTime ?? new Date("1970-01-01T00:00:00.000Z")),
      activity: "Arzttermin",
      location: "—",
      travelMinutes: 0,
      grossMinutes: appointment.paidMinutes,
      breakMinutes: 0,
      workMinutes: appointment.paidMinutes,
      noteEmployee: "",
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.createdAt.toISOString(),
    }));

  const entrySnapshot = [
    ...workEntrySnapshot,
    ...doctorAppointmentSnapshot,
  ].sort((a, b) => {
    if (a.workDate !== b.workDate) {
      return a.workDate < b.workDate ? -1 : 1;
    }

    if (a.startTime !== b.startTime) {
      return a.startTime < b.startTime ? -1 : 1;
    }

    return 0;
  });

  const existingTask = await prisma.task.findFirst({
    where: {
      assignedToUserId: session.userId,
      status: TaskStatus.OPEN,
      requiredAction: TaskRequiredAction.CONFIRM_MONTHLY_WORK_ENTRIES,
      referenceStartDate: dateOnlyUTC(range.startYMD),
      referenceEndDate: dateOnlyUTC(range.endYMD),
    },
    select: {
      id: true,
    },
  });

  const taskId = await prisma.$transaction(async (tx) => {
    await tx.monthlyWorkEntryConfirmation.upsert({
      where: {
        userId_year_month: {
          userId: session.userId,
          year,
          month,
        },
      },
      update: {
        status: MonthlyWorkEntryConfirmationStatus.REJECTED,
        confirmedAt: null,
        rejectedAt: new Date(),
        rejectionReason,
        rejectionReasonSourceLanguage: "DE",
        rejectionReasonTranslations: undefined,
        entrySnapshot,
        requiredUntilAt: dueAt,
      },
      create: {
        userId: session.userId,
        year,
        month,
        status: MonthlyWorkEntryConfirmationStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason,
        rejectionReasonSourceLanguage: "DE",
        entrySnapshot,
        requiredUntilAt: dueAt,
      },
    });

    if (existingTask) {
      await tx.task.update({
        where: {
          id: existingTask.id,
        },
        data: {
          title: getTaskTitle(language, monthLabel),
          description: getTaskDescription(language, monthLabel),
          dueAt,
          updatedAt: new Date(),
        },
      });

      return existingTask.id;
    }

    const task = await tx.task.create({
      data: {
        assignedToUserId: session.userId,
        createdByUserId: session.userId,
        title: getTaskTitle(language, monthLabel),
        description: getTaskDescription(language, monthLabel),
        category: TaskCategory.WORK_TIME,
        status: TaskStatus.OPEN,
        requiredAction: TaskRequiredAction.CONFIRM_MONTHLY_WORK_ENTRIES,
        referenceStartDate: dateOnlyUTC(range.startYMD),
        referenceEndDate: dateOnlyUTC(range.endYMD),
        dueAt,
      },
      select: {
        id: true,
      },
    });

    return task.id;
  });

  try {
    await sendPushToUser(session.userId, {
      companyId: session.companyId,
      companySubdomain: session.companySubdomain,
      title: getPushTitle(language),
      body: getPushBody(language, monthLabel),
      url: buildPushUrl(
        `/erfassung?confirmMonth=${encodeURIComponent(
          `${year}-${String(month).padStart(2, "0")}`
        )}&sourceTaskId=${encodeURIComponent(taskId)}`
      ),
    });
  } catch (error) {
    console.error("Push für Monatsbestätigung fehlgeschlagen:", error);
  }

  return NextResponse.json({
    ok: true,
    taskId,
    requiredUntilAt: dueAt.toISOString(),
  });
}