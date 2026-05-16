import { NextResponse } from "next/server";
import {
  Prisma,
  TaskCategory,
  TaskRequiredAction,
  TaskStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { sendPushToUser } from "@/lib/webpush";
import { ensureTimeEntryUnlockRange } from "@/lib/timesheetLock";
import { translateAllLanguages, type SupportedLang } from "@/lib/translate";
import {
  ADMIN_TASKS_UI_TEXTS,
  normalizeAppUiLanguage,
  translate,
  type AdminTasksTextKey,
  type AppUiLanguage,
} from "@/lib/i18n";

type CreateTaskBody = {
  assignedToUserId?: string;
  title?: string;
  description?: string;
  category?: string;
  requiredAction?: string;
  referenceStartDate?: string;
  referenceEndDate?: string;
};

function isTaskCategory(value: string): value is TaskCategory {
  return (
    value === "WORK_TIME" ||
    value === "VACATION" ||
    value === "SICKNESS" ||
    value === "GENERAL"
  );
}

function isTaskRequiredAction(value: string): value is TaskRequiredAction {
  return (
    value === "NONE" ||
    value === "WORK_ENTRY_FOR_DATE" ||
    value === "VACATION_ENTRY_FOR_DATE" ||
    value === "SICK_ENTRY_FOR_DATE" ||
    value === "CONFIRM_MONTHLY_WORK_ENTRIES"
  );
}

function parseOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseReferenceDate(value: string | null): Date | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

function toIsoDateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
}): { startDate: string; endDate: string } | null {
  const start = args.referenceStartDate ?? args.referenceDate;
  const end = args.referenceEndDate ?? args.referenceStartDate ?? args.referenceDate;

  if (!start || !end) {
    return null;
  }

  return {
    startDate: toIsoDateUTC(start),
    endDate: toIsoDateUTC(end),
  };
}

function hasMissingDateInRange(
  missingDateSet: ReadonlySet<string>,
  startDate: string,
  endDate: string
): boolean {
  for (
    let current = new Date(`${startDate}T00:00:00.000Z`);
    current <= new Date(`${endDate}T00:00:00.000Z`);
    current = addUtcDays(current, 1)
  ) {
    const ymd = toIsoDateUTC(current);
    if (missingDateSet.has(ymd)) {
      return true;
    }
  }

  return false;
}

function shouldKeepTask(args: {
  task: {
    status: TaskStatus;
    category: TaskCategory;
    requiredAction: TaskRequiredAction;
    referenceDate: Date | null;
    referenceStartDate: Date | null;
    referenceEndDate: Date | null;
  };
  missingDateSet: ReadonlySet<string>;
}): boolean {
  const { task, missingDateSet } = args;

  if (task.status !== TaskStatus.OPEN) {
    return true;
  }

  if (
    task.category === TaskCategory.WORK_TIME &&
    task.requiredAction === TaskRequiredAction.WORK_ENTRY_FOR_DATE
  ) {
    const range = getTaskReferenceRange({
      referenceDate: task.referenceDate,
      referenceStartDate: task.referenceStartDate,
      referenceEndDate: task.referenceEndDate,
    });

    if (!range) {
      return true;
    }

    return hasMissingDateInRange(
      missingDateSet,
      range.startDate,
      range.endDate
    );
  }

  return true;
}

function normalizeReferenceRange(args: {
  referenceStartDateRaw: string | null;
  referenceEndDateRaw: string | null;
}): {
  referenceDate: Date | null;
  referenceStartDate: Date | null;
  referenceEndDate: Date | null;
} | null {

  const startDate = parseReferenceDate(args.referenceStartDateRaw);
  const endDate = parseReferenceDate(args.referenceEndDateRaw ?? args.referenceStartDateRaw);

  if (args.referenceStartDateRaw && !startDate) {
    return null;
  }

  if ((args.referenceEndDateRaw ?? args.referenceStartDateRaw) && !endDate) {
    return null;
  }

  if (!startDate && !endDate) {
    return {
      referenceDate: null,
      referenceStartDate: null,
      referenceEndDate: null,
    };
  }

  if (!startDate || !endDate) {
    return null;
  }

  const startYMD = toIsoDateUTC(startDate);
  const endYMD = toIsoDateUTC(endDate);

  if (startYMD > endYMD) {
    return null;
  }

  return {
    referenceDate: startDate,
    referenceStartDate: startDate,
    referenceEndDate: endDate,
  };
}

type TranslationMap = Partial<Record<SupportedLang, string>>;

function isTranslationMap(value: Prisma.JsonValue | null | undefined): value is TranslationMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return true;
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
  translations: Prisma.JsonValue | null | undefined,
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

function toPrismaNullableJsonInput(
  value: TranslationMap | null
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

function toAppUiLanguage(language: string | null | undefined): AppUiLanguage {
  return normalizeAppUiLanguage(language);
}

function tTask(
  language: string | null | undefined,
  key: AdminTasksTextKey
): string {
  return translate(
    toAppUiLanguage(language),
    key,
    ADMIN_TASKS_UI_TEXTS
  );
}

export async function GET(): Promise<NextResponse> {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: tTask("DE", "noAccess") },
      { status: 401 }
    );
  }

  const adminUser = await prisma.appUser.findUnique({
    where: { id: admin.id },
    select: {
      language: true,
    },
  });

  const [tasks, employees] = await Promise.all([
    prisma.task.findMany({
      where: {
        assignedToUser: {
          companyId: admin.companyId,
        },
      },
      orderBy: [
        { status: "asc" },
        { completedAt: "desc" },
        { referenceStartDate: "desc" },
        { referenceDate: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        assignedToUser: {
          select: {
            id: true,
            fullName: true,
            isActive: true,
          },
        },
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
    }),
    prisma.appUser.findMany({
      where: {
        isActive: true,
        role: "EMPLOYEE",
        companyId: admin.companyId,
      },
      orderBy: {
        fullName: "asc",
      },
      select: {
        id: true,
        fullName: true,
      },
    }),
  ]);

  return NextResponse.json({
    tasks: tasks.map((task) => ({
      ...task,
      title: getTranslatedText(
        task.title,
        task.titleTranslations,
        adminUser?.language ?? "DE"
      ),
      description: getTranslatedText(
        task.description,
        task.descriptionTranslations,
        adminUser?.language ?? "DE"
      ),
      completionNote: getTranslatedText(
        task.completionNote,
        task.completionNoteTranslations,
        adminUser?.language ?? "DE"
      ),
      attachments: task.attachments.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        url: `/api/task-attachments/${encodeURIComponent(attachment.id)}/file`,
        createdAt: attachment.createdAt.toISOString(),
      })),
    })),
    employees,
  });
}

export async function POST(req: Request): Promise<NextResponse> {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: tTask("DE", "noAccess") },
      { status: 401 }
    );
  }

  const adminUser = await prisma.appUser.findUnique({
    where: { id: admin.id },
    select: {
      language: true,
    },
  });

  const adminLanguage = adminUser?.language ?? "DE";

  let body: CreateTaskBody;
  try {
    body = (await req.json()) as CreateTaskBody;
  } catch {
    return NextResponse.json(
      { error: tTask(adminLanguage, "invalidRequest") },
      { status: 400 }
    );
  }

  const assignedToUserId = parseOptionalString(body.assignedToUserId);
  const title = parseOptionalString(body.title);
  const description = parseOptionalString(body.description);
  const categoryRaw = parseOptionalString(body.category);
  const requiredActionRaw = parseOptionalString(body.requiredAction) ?? "NONE";
  const referenceStartDateRaw = parseOptionalString(body.referenceStartDate);
  const referenceEndDateRaw = parseOptionalString(body.referenceEndDate);

  if (!assignedToUserId) {
    return NextResponse.json(
      { error: tTask(adminLanguage, "assignedToUserIdMissing") },
      { status: 400 }
    );
  }

  if (!title) {
    return NextResponse.json(
      { error: tTask(adminLanguage, "titleMissing") },
      { status: 400 }
    );
  }

  if (!categoryRaw || !isTaskCategory(categoryRaw)) {
    return NextResponse.json(
      { error: tTask(adminLanguage, "invalidCategory") },
      { status: 400 }
    );
  }

  if (!isTaskRequiredAction(requiredActionRaw)) {
    return NextResponse.json(
      { error: tTask(adminLanguage, "invalidRequiredAction") },
      { status: 400 }
    );
  }

  const normalizedReferenceRange = normalizeReferenceRange({
    referenceStartDateRaw,
    referenceEndDateRaw,
  });

  if (!normalizedReferenceRange) {
    return NextResponse.json(
      { error: tTask(adminLanguage, "invalidReferenceRange") },
      { status: 400 }
    );
  }

  const assignedUser = await prisma.appUser.findUnique({
    where: { id: assignedToUserId },
    select: {
      id: true,
      fullName: true,
      isActive: true,
      role: true,
      companyId: true,
      language: true,
    },
  });

  if (!assignedUser || !assignedUser.isActive) {
    return NextResponse.json(
      { error: tTask(adminLanguage, "employeeNotFoundOrInactive") },
      { status: 404 }
    );
  }

  if (assignedUser.companyId !== admin.companyId) {
    return NextResponse.json(
      { error: tTask(adminLanguage, "noAccess") },
      { status: 403 }
    );
  }

  if (assignedUser.role !== "EMPLOYEE") {
    return NextResponse.json(
      { error: tTask(adminLanguage, "tasksOnlyForEmployees") },
      { status: 400 }
    );
  }

  let titleSourceLanguage: SupportedLang | null = null;
  let titleTranslationsRecord: TranslationMap | null = null;
  let titleTranslations: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
    Prisma.JsonNull;

  if (title.trim()) {
    const translationResult = await translateAllLanguages(title);
    titleSourceLanguage = translationResult.sourceLanguage;
    titleTranslationsRecord = translationResult.translations;
    titleTranslations = toPrismaNullableJsonInput(translationResult.translations);
  }

  let descriptionSourceLanguage: SupportedLang | null = null;
  let descriptionTranslationsRecord: TranslationMap | null = null;
  let descriptionTranslations: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
    Prisma.JsonNull;

  if (description && description.trim()) {
    const translationResult = await translateAllLanguages(description);
    descriptionSourceLanguage = translationResult.sourceLanguage;
    descriptionTranslationsRecord = translationResult.translations;
    descriptionTranslations = toPrismaNullableJsonInput(translationResult.translations);
  }

  const task = await prisma.task.create({
    data: {
      assignedToUserId: assignedUser.id,
      createdByUserId: admin.id,
      title,
      titleSourceLanguage,
      titleTranslations,
      description,
      descriptionSourceLanguage,
      descriptionTranslations,
      category: categoryRaw,
      status: TaskStatus.OPEN,
      requiredAction: requiredActionRaw,
      referenceDate: normalizedReferenceRange.referenceDate,
      referenceStartDate: normalizedReferenceRange.referenceStartDate,
      referenceEndDate: normalizedReferenceRange.referenceEndDate,
    },
    include: {
      assignedToUser: {
        select: {
          id: true,
          fullName: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  if (
    task.category === TaskCategory.WORK_TIME &&
    task.requiredAction === TaskRequiredAction.WORK_ENTRY_FOR_DATE
  ) {
    const referenceRange = getTaskReferenceRange({
      referenceDate: task.referenceDate,
      referenceStartDate: task.referenceStartDate,
      referenceEndDate: task.referenceEndDate,
    });

    if (referenceRange) {
      await ensureTimeEntryUnlockRange({
        userId: assignedUser.id,
        startDateYMD: referenceRange.startDate,
        endDateYMD: referenceRange.endDate,
        companyId: admin.companyId,
      });
    }
  }

  await sendPushToUser(assignedUser.id, {
    title: tTask(assignedUser.language ?? "DE", "newTaskPushTitle"),
    body: getTranslatedText(
      title,
      titleTranslationsRecord,
      assignedUser.language ?? "DE"
    ),
    url: "/aufgaben",
  });

  return NextResponse.json(
  {
    task: {
      ...task,
      attachments: [],
    },
  },
  { status: 201 }
);
}