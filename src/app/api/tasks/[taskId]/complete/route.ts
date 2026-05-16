import { NextResponse } from "next/server";
import {
  AbsenceRequestStatus,
  AbsenceType,
  Prisma,
  TaskRequiredAction,
  TaskStatus,
} from "@prisma/client";
import Holidays from "date-holidays";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendPushToUser } from "@/lib/webpush";
import { translateAllLanguages } from "@/lib/translate";
import {
  ADMIN_TASKS_UI_TEXTS,
  translate,
  type AppUiLanguage,
  type AdminTasksTextKey,
} from "@/lib/i18n";

type SupportedLang = "DE" | "EN" | "IT" | "TR" | "SQ" | "KU" | "RO";
type TranslationMap = Partial<Record<SupportedLang, string>>;

function isTranslationMap(value: unknown): value is TranslationMap {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toSupportedLang(language: string | null | undefined): SupportedLang {
  if (
    language === "DE" ||
    language === "EN" ||
    language === "IT" ||
    language === "TR" ||
    language === "SQ" ||
    language === "KU" ||
    language === "RO"
  ) {
    return language;
  }

  return "DE";
}

function getTranslatedText(
  originalText: string | null | undefined,
  translations: unknown,
  language: string | null | undefined
): string {
  const fallback = originalText ?? "";
  const targetLanguage = toSupportedLang(language);

  if (!isTranslationMap(translations)) {
    return fallback;
  }

  const translated = translations[targetLanguage];
  return typeof translated === "string" && translated.trim() ? translated : fallback;
}

type Params = {
  params: Promise<{
    taskId: string;
  }>;
};

type CompleteTaskPayload = {
  completionNote?: string;
};

function isCompleteTaskPayload(value: unknown): value is CompleteTaskPayload {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    record["completionNote"] === undefined ||
    typeof record["completionNote"] === "string"
  );
}

function normalizeCompletionNote(value: string | undefined): string | null {
  const normalized = value?.trim() ?? "";

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, 1000);
}

function toPrismaNullableJsonInput(
  value: TranslationMap | null
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

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

function isWeekdayUTC(date: Date): boolean {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
}

function getPublicHolidaySetForRange(startDate: Date, endDate: Date): Set<string> {
  const holidays = new Holidays("DE", "BW");
  const result = new Set<string>();

  for (
    let year = startDate.getUTCFullYear();
    year <= endDate.getUTCFullYear();
    year += 1
  ) {
    for (const holiday of holidays.getHolidays(year)) {
      if (holiday.type === "public") {
        result.add(holiday.date.slice(0, 10));
      }
    }
  }

  return result;
}

function isRelevantTaskDay(date: Date, holidaySet: ReadonlySet<string>): boolean {
  const ymd = toIsoDateUTC(date);

  if (!isWeekdayUTC(date)) {
    return false;
  }

  if (holidaySet.has(ymd)) {
    return false;
  }

  return true;
}

async function hasAbsenceOrRequestForDate(args: {
  userId: string;
  date: Date;
  type: AbsenceType;
}): Promise<boolean> {
  const nextDay = addUtcDays(args.date, 1);

  const [absence, request] = await Promise.all([
    prisma.absence.findFirst({
      where: {
        userId: args.userId,
        type: args.type,
        absenceDate: {
          gte: args.date,
          lt: nextDay,
        },
      },
      select: {
        id: true,
      },
    }),
    prisma.absenceRequest.findFirst({
      where: {
        userId: args.userId,
        type: args.type,
        status: {
          in: [AbsenceRequestStatus.PENDING, AbsenceRequestStatus.APPROVED],
        },
        startDate: {
          lte: args.date,
        },
        endDate: {
          gte: args.date,
        },
      },
      select: {
        id: true,
      },
    }),
  ]);

  return Boolean(absence || request);
}

async function hasBlockingAbsenceForWorkEntryTask(args: {
  userId: string;
  date: Date;
}): Promise<boolean> {
  const [hasVacation, hasSick] = await Promise.all([
    hasAbsenceOrRequestForDate({
      userId: args.userId,
      date: args.date,
      type: AbsenceType.VACATION,
    }),
    hasAbsenceOrRequestForDate({
      userId: args.userId,
      date: args.date,
      type: AbsenceType.SICK,
    }),
  ]);

  return hasVacation || hasSick;
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
  const holidaySet = getPublicHolidaySetForRange(range.startDate, range.endDate);

  if (requiredAction === "WORK_ENTRY_FOR_DATE") {
    for (
      let current = startOfDayUTC(rangeStartYmd);
      current <= startOfDayUTC(rangeEndYmd);
      current = addUtcDays(current, 1)
    ) {
      if (!isRelevantTaskDay(current, holidaySet)) {
        continue;
      }

      const hasAbsence = await hasBlockingAbsenceForWorkEntryTask({
        userId,
        date: current,
      });

      if (hasAbsence) {
        continue;
      }

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
      if (!isRelevantTaskDay(current, holidaySet)) {
        continue;
      }

      const hasSick = await hasAbsenceOrRequestForDate({
        userId,
        date: current,
        type: AbsenceType.SICK,
      });

      if (hasSick) {
        continue;
      }

      const hasVacation = await hasAbsenceOrRequestForDate({
        userId,
        date: current,
        type: AbsenceType.VACATION,
      });

      if (!hasVacation) {
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
      if (!isRelevantTaskDay(current, holidaySet)) {
        continue;
      }

      const hasVacation = await hasAbsenceOrRequestForDate({
        userId,
        date: current,
        type: AbsenceType.VACATION,
      });

      if (hasVacation) {
        continue;
      }

      const hasSick = await hasAbsenceOrRequestForDate({
        userId,
        date: current,
        type: AbsenceType.SICK,
      });

      if (!hasSick) {
        return false;
      }
    }

    return true;
  }

  return false;
}

export async function POST(
  req: Request,
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
    session.language === "KU" ||
    session.language === "RO"
      ? session.language
      : "DE";

  const payloadUnknown: unknown = await req.json().catch(() => ({}));
  const payload: CompleteTaskPayload = isCompleteTaskPayload(payloadUnknown)
    ? payloadUnknown
    : {};

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

  const completionNote =
    existingTask.category === "GENERAL"
      ? normalizeCompletionNote(payload.completionNote)
      : null;

  let completionNoteSourceLanguage: SupportedLang | null = null;
  let completionNoteTranslations: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
    Prisma.JsonNull;

  if (completionNote) {
    const translationResult = await translateAllLanguages(completionNote);
    completionNoteSourceLanguage = translationResult.sourceLanguage;
    completionNoteTranslations = toPrismaNullableJsonInput(
      translationResult.translations
    );
  }

  const task = await prisma.task.update({
    where: { id: existingTask.id },
    data: {
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
      completedByUserId: session.userId,
      completionNote,
      completionNoteSourceLanguage,
      completionNoteTranslations,
    },
    include: {
      assignedToUser: {
        select: {
          id: true,
          fullName: true,
        },
      },
      attachments: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
      },
    },
  });

  const admins = await prisma.appUser.findMany({
    where: {
      companyId: session.companyId,
      role: "ADMIN",
      isActive: true,
    },
    select: {
      id: true,
      language: true,
    },
  });

  for (const adminUser of admins) {
    const adminLanguage = toSupportedLang(adminUser.language);

    await sendPushToUser(adminUser.id, {
      title: translateAdminTaskText(adminLanguage, "taskCompletedPushTitle"),
      body: `${task.assignedToUser.fullName}: ${getTranslatedText(
        task.title,
        task.titleTranslations,
        adminLanguage
      )}`,
      url: "/admin/tasks",
    });
  }

  return NextResponse.json({
    task: {
      ...task,
      title: getTranslatedText(
        task.title,
        task.titleTranslations,
        session.language
      ),
      description: getTranslatedText(
        task.description,
        task.descriptionTranslations,
        session.language
      ),
      completionNote: getTranslatedText(
        task.completionNote,
        task.completionNoteTranslations,
        session.language
      ),
      attachments: task.attachments.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        url: `/api/task-attachments/${encodeURIComponent(attachment.id)}/file`,
        createdAt: attachment.createdAt.toISOString(),
      })),
    },
  });
}