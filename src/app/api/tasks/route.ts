import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { berlinTodayYMD, getMissingRequiredWorkDates } from "@/lib/timesheetLock";
import { Prisma } from "@prisma/client";

type MissingWorkEntryAlert = {
  count: number;
  oldestMissingDate: string;
  newestMissingDate: string;
} | null;

type SupportedLang = "DE" | "EN" | "IT" | "TR" | "SQ" | "KU" | "RO";
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
    status: string;
    category: string;
    requiredAction: string;
    referenceDate: Date | null;
    referenceStartDate: Date | null;
    referenceEndDate: Date | null;
  };
  missingDateSet: ReadonlySet<string>;
}): boolean {
  const { task, missingDateSet } = args;

  if (task.status !== "OPEN") {
    return true;
  }

  if (
    task.category === "WORK_TIME" &&
    task.requiredAction === "WORK_ENTRY_FOR_DATE"
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

export async function GET(req: Request): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const todayYMD = berlinTodayYMD();

  try {
    const tasks = await prisma.task.findMany({
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
        { completedAt: "desc" },
        { referenceStartDate: "desc" },
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
    });

    let missingDates: string[] = [];

    try {
      missingDates = await getMissingRequiredWorkDates(session.userId, todayYMD, {
        includeUntilDate: true,
        companyId: session.companyId,
      });
    } catch (error) {
      console.error("getMissingRequiredWorkDates fehlgeschlagen in /api/tasks:", error);
      missingDates = [];
    }

    const missingWorkEntryAlert: MissingWorkEntryAlert =
      missingDates.length > 0
        ? {
            count: missingDates.length,
            oldestMissingDate: missingDates[0],
            newestMissingDate: missingDates[missingDates.length - 1],
          }
        : null;

    const missingDateSet = new Set(missingDates);

    return NextResponse.json({
      tasks: tasks
        .filter((task) =>
          shouldKeepTask({
            task: {
              status: task.status,
              category: task.category,
              requiredAction: task.requiredAction,
              referenceDate: task.referenceDate,
              referenceStartDate: task.referenceStartDate,
              referenceEndDate: task.referenceEndDate,
            },
            missingDateSet,
          })
        )
        .map((task) => ({
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
        })),
      missingWorkEntryAlert,
    });
  } catch (error) {
    console.error("/api/tasks fehlgeschlagen:", error);

    return NextResponse.json(
      {
        error: "Aufgaben konnten nicht geladen werden.",
        tasks: [],
        missingWorkEntryAlert: null,
      },
      { status: 500 }
    );
  }
}