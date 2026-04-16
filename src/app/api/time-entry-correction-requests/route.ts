import { NextResponse } from "next/server";
import {
  Prisma,
  Role,
  TaskRequiredAction,
  TaskStatus,
  TimeEntryCorrectionRequestStatus,
} from "@prisma/client";
import { getSession } from "@/lib/auth";
import {
  normalizeAppUiLanguage,
  TIME_ENTRY_CORRECTION_API_TEXTS,
  translate,
} from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import {
  berlinTodayYMD,
  getLockedMissingRequiredWorkDates,
  getMissingRequiredWorkDates,
} from "@/lib/timesheetLock";
import { translateAllLanguages, type SupportedLang } from "@/lib/translate";
import { buildPushUrl, sendPushToAdmins } from "@/lib/webpush";

type CreateTimeEntryCorrectionRequestBody = {
  targetDate?: unknown;
  noteEmployee?: unknown;
  sourceTaskId?: unknown;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function isYYYYMMDD(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function dateOnlyUTC(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

function toIsoDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type TranslationMap = Partial<Record<SupportedLang, string>>;

function isTranslationMap(
  value: Prisma.JsonValue | null | undefined
): value is TranslationMap {
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

function getTranslatedText(args: {
  originalText: string | null;
  translations: Prisma.JsonValue | null | undefined;
  language: string | null | undefined;
}): string {
  const fallback = args.originalText ?? "";
  const targetLanguage = toSupportedLang(args.language);

  if (!isTranslationMap(args.translations)) {
    return fallback;
  }

  const translated = args.translations[targetLanguage];
  return typeof translated === "string" && translated.trim() ? translated : fallback;
}

function toPrismaNullableJsonInput(
  value: Record<string, string> | null
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

async function findValidAdminTaskForAutoApproval(args: {
  sourceTaskId: string;
  userId: string;
  companyId: string;
  targetDate: string;
}): Promise<{
  id: string;
} | null> {
  if (!args.sourceTaskId) {
    return null;
  }

  const task = await prisma.task.findFirst({
    where: {
      id: args.sourceTaskId,
      assignedToUserId: args.userId,
      status: TaskStatus.OPEN,
      category: "WORK_TIME",
      requiredAction: TaskRequiredAction.WORK_ENTRY_FOR_DATE,
      referenceDate: dateOnlyUTC(args.targetDate),
      assignedToUser: {
        companyId: args.companyId,
      },
      createdByUser: {
        role: Role.ADMIN,
        companyId: args.companyId,
      },
    },
    select: {
      id: true,
    },
  });

  return task ?? null;
}

function mapRequest(
  r: {
    id: string;
    startDate: Date;
    endDate: Date;
    status: TimeEntryCorrectionRequestStatus;
    noteEmployee: string | null;
    noteEmployeeTranslations: Prisma.JsonValue | null;
    noteAdmin: string | null;
    noteAdminTranslations: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
    decidedAt: Date | null;
    user: {
      id: string;
      fullName: string;
    };
    decidedBy: {
      id: string;
      fullName: string;
    } | null;
  },
  language: string | null | undefined
) {
  return {
    id: r.id,
    startDate: toIsoDateUTC(r.startDate),
    endDate: toIsoDateUTC(r.endDate),
    status: r.status,
    noteEmployee: getTranslatedText({
      originalText: r.noteEmployee,
      translations: r.noteEmployeeTranslations,
      language,
    }),
    noteAdmin: getTranslatedText({
      originalText: r.noteAdmin,
      translations: r.noteAdminTranslations,
      language,
    }),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    decidedAt: r.decidedAt ? r.decidedAt.toISOString() : null,
    user: {
      id: r.user.id,
      fullName: r.user.fullName,
    },
    decidedBy: r.decidedBy
      ? {
          id: r.decidedBy.id,
          fullName: r.decidedBy.fullName,
        }
      : null,
  };
}

export async function GET() {
  const session = await getSession();
  const language = normalizeAppUiLanguage(session?.language);
  const t = (key: keyof typeof TIME_ENTRY_CORRECTION_API_TEXTS) =>
    translate(language, key, TIME_ENTRY_CORRECTION_API_TEXTS);

  if (!session) {
    return NextResponse.json(
      { ok: false, error: t("notLoggedIn") },
      { status: 401 }
    );
  }

  const requests = await prisma.timeEntryCorrectionRequest.findMany({
    where: {
      userId: session.userId,
      user: {
        companyId: session.companyId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
      decidedBy: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json({
    ok: true,
    requests: requests.map((request) => mapRequest(request, session.language)),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  const language = normalizeAppUiLanguage(session?.language);
  const t = (key: keyof typeof TIME_ENTRY_CORRECTION_API_TEXTS) =>
    translate(language, key, TIME_ENTRY_CORRECTION_API_TEXTS);

  if (!session) {
    return NextResponse.json(
      { ok: false, error: t("notLoggedIn") },
      { status: 401 }
    );
  }

  if (session.role !== Role.EMPLOYEE) {
    return NextResponse.json(
      { ok: false, error: t("employeeOnlyCreate") },
      { status: 403 }
    );
  }

  const raw = (await req.json().catch(() => null)) as unknown;
  const body: CreateTimeEntryCorrectionRequestBody = isRecord(raw) ? raw : {};

  const targetDate = getString(body.targetDate).trim();
  const noteEmployee = getString(body.noteEmployee).trim();
  const sourceTaskId = getString(body.sourceTaskId).trim();

  if (!isYYYYMMDD(targetDate)) {
    return NextResponse.json(
      { ok: false, error: t("invalidTargetDate") },
      { status: 400 }
    );
  }

  const adminTaskForAutoApproval = await findValidAdminTaskForAutoApproval({
    sourceTaskId,
    userId: session.userId,
    companyId: session.companyId,
    targetDate,
  });

  const today = berlinTodayYMD();

  if (targetDate >= today) {
    return NextResponse.json(
      { ok: false, error: t("pastDaysOnly") },
      { status: 400 }
    );
  }

  const lockedMissingDates = await getLockedMissingRequiredWorkDates(
    session.userId,
    today,
    5,
    session.companyId
  );


  if (lockedMissingDates.length === 0) {
    return NextResponse.json(
      { ok: false, error: t("noLockedMissingEntries") },
      { status: 409 }
    );
  }

  if (
    !lockedMissingDates.includes(targetDate) &&
    !adminTaskForAutoApproval
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: t("requestNotRequiredForDate"),
      },
      { status: 409 }
    );
  }

  const startDateYMD = lockedMissingDates[0];
  const endDateYMD = lockedMissingDates[lockedMissingDates.length - 1];

  const startDate = dateOnlyUTC(startDateYMD);
  const endDate = dateOnlyUTC(endDateYMD);

  const existingPending = await prisma.timeEntryCorrectionRequest.findFirst({
    where: {
      userId: session.userId,
      status: TimeEntryCorrectionRequestStatus.PENDING,
      startDate: {
        lte: endDate,
      },
      endDate: {
        gte: startDate,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingPending) {
    return NextResponse.json(
      { ok: false, error: t("existingPendingForPeriod") },
      { status: 409 }
    );
  }

  let noteEmployeeSourceLanguage: SupportedLang | null = null;
  let noteEmployeeTranslations: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
    Prisma.JsonNull;

  if (noteEmployee) {
    const translationResult = await translateAllLanguages(noteEmployee);
    noteEmployeeSourceLanguage = translationResult.sourceLanguage;
    noteEmployeeTranslations = toPrismaNullableJsonInput(
      translationResult.translations
    );
  }

  const created = await prisma.$transaction(async (tx) => {
    const request = await tx.timeEntryCorrectionRequest.create({
      data: {
        userId: session.userId,
        startDate,
        endDate,
        status: adminTaskForAutoApproval
          ? TimeEntryCorrectionRequestStatus.APPROVED
          : TimeEntryCorrectionRequestStatus.PENDING,
        noteEmployee: noteEmployee || null,
        noteEmployeeSourceLanguage,
        noteEmployeeTranslations,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
        decidedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (adminTaskForAutoApproval) {
      for (const ymd of lockedMissingDates) {
        const day = dateOnlyUTC(ymd);

        await tx.timeEntryUnlock.upsert({
          where: {
            userId_workDate: {
              userId: session.userId,
              workDate: day,
            },
          },
          update: {
            requestId: request.id,
            usedAt: null,
            expiresAt: null,
          },
          create: {
            userId: session.userId,
            workDate: day,
            requestId: request.id,
            expiresAt: null,
            usedAt: null,
          },
        });
      }
    }

    return request;
  });

  const dateLabel =
    startDateYMD === endDateYMD
      ? startDateYMD
      : `${startDateYMD} bis ${endDateYMD}`;

  if (!adminTaskForAutoApproval) {
    await sendPushToAdmins({
      companyId: session.companyId,
      title: t("newCorrectionRequestPushTitle"),
      body: translate(language, "newCorrectionRequestPushBody", TIME_ENTRY_CORRECTION_API_TEXTS)
        .replace("{name}", session.fullName)
        .replace("{dateLabel}", dateLabel),
      url: buildPushUrl("/admin/nachtragsanfragen"),
    });
  }

  return NextResponse.json({
    ok: true,
    request: mapRequest(created, session.language),
    autoApprovedFromAdminTask: Boolean(adminTaskForAutoApproval),
  });
}