import { NextResponse } from "next/server";
import { Prisma, Role, WorkEntryEditRequestStatus } from "@prisma/client";
import { getSession } from "@/lib/auth";
import {
  ERFASSUNG_DICTIONARY,
  normalizeAppUiLanguage,
  TIME_ENTRY_CORRECTION_API_TEXTS,
  translate,
} from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { translateAllLanguages, type SupportedLang } from "@/lib/translate";
import { buildPushUrl, sendLocalizedPushToAdmins } from "@/lib/webpush";
import { berlinTodayYMD } from "@/lib/timesheetLock";

type CreateWorkEntryEditRequestBody = {
  workEntryId?: unknown;
  requestedWorkDate?: unknown;
  requestedStartTime?: unknown;
  requestedEndTime?: unknown;
  requestedActivity?: unknown;
  requestedLocation?: unknown;
  requestedTravelMinutes?: unknown;
  requestedNoteEmployee?: unknown;
  reason?: unknown;
};

type TranslationInput = {
  sourceLanguage: SupportedLang | null;
  translations: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function isYYYYMMDD(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isHHMM(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

function dateOnlyUTC(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

function timeOnlyUTC(hhmm: string): Date {
  return new Date(`1970-01-01T${hhmm}:00.000Z`);
}

function toIsoDateUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toBerlinDateYMD(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
}

function requiresEditRequestForEntry(args: {
  workDateYMD: string;
  updatedAt: Date;
  now?: Date;
}): boolean {
  const now = args.now ?? new Date();
  const todayYMD = berlinTodayYMD(now);

  if (args.workDateYMD >= todayYMD) {
    return false;
  }

  return toBerlinDateYMD(args.updatedAt) < todayYMD;
}

function toPrismaNullableJsonInput(
  value: Record<string, string> | null
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

async function translateOptionalText(value: string): Promise<TranslationInput> {
  if (!value.trim()) {
    return {
      sourceLanguage: null,
      translations: Prisma.JsonNull,
    };
  }

  const translated = await translateAllLanguages(value);

  return {
    sourceLanguage: translated.sourceLanguage,
    translations: toPrismaNullableJsonInput(translated.translations),
  };
}

export async function POST(req: Request) {
  const session = await getSession();
  const language = normalizeAppUiLanguage(session?.language);

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        error: translate(language, "notLoggedIn", TIME_ENTRY_CORRECTION_API_TEXTS),
      },
      { status: 401 }
    );
  }

  if (session.role !== Role.EMPLOYEE) {
    return NextResponse.json(
      {
        ok: false,
        error: translate(language, "employeeOnlyCreate", TIME_ENTRY_CORRECTION_API_TEXTS),
      },
      { status: 403 }
    );
  }

  const raw = (await req.json().catch(() => null)) as unknown;
  const body: CreateWorkEntryEditRequestBody = isRecord(raw) ? raw : {};

  const workEntryId = getString(body.workEntryId).trim();
  const requestedWorkDate = getString(body.requestedWorkDate).trim();
  const requestedStartTime = getString(body.requestedStartTime).trim();
  const requestedEndTime = getString(body.requestedEndTime).trim();
  const requestedActivity = getString(body.requestedActivity).trim();
  const requestedLocation = getString(body.requestedLocation).trim();
  const requestedTravelMinutes = Math.max(0, Math.round(getNumber(body.requestedTravelMinutes)));
  const requestedNoteEmployee = getString(body.requestedNoteEmployee).trim();
  const reason = getString(body.reason).trim();

  if (!workEntryId) {
    return NextResponse.json(
      { ok: false, error: "Eintrag fehlt." },
      { status: 400 }
    );
  }

  if (
    !isYYYYMMDD(requestedWorkDate) ||
    !isHHMM(requestedStartTime) ||
    !isHHMM(requestedEndTime) ||
    !requestedActivity ||
    !requestedLocation
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: translate(language, "invalidTargetDate", TIME_ENTRY_CORRECTION_API_TEXTS),
      },
      { status: 400 }
    );
  }

  if (!reason) {
    return NextResponse.json(
      {
        ok: false,
        error: translate(language, "editRequestReasonRequired", ERFASSUNG_DICTIONARY),
      },
      { status: 400 }
    );
  }

  const entry = await prisma.workEntry.findFirst({
    where: {
      id: workEntryId,
      userId: session.userId,
      user: {
        companyId: session.companyId,
        isActive: true,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          companyId: true,
        },
      },
    },
  });

  if (!entry) {
    return NextResponse.json(
      { ok: false, error: "Eintrag nicht gefunden." },
      { status: 404 }
    );
  }

  const existingWorkDateYMD = toIsoDateUTC(entry.workDate);

  if (
    !requiresEditRequestForEntry({
      workDateYMD: existingWorkDateYMD,
      updatedAt: entry.updatedAt,
    })
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Für diesen Eintrag ist aktuell keine Änderungsanfrage erforderlich.",
      },
      { status: 409 }
    );
  }

  const existingPending = await prisma.workEntryEditRequest.findFirst({
    where: {
      workEntryId: entry.id,
      userId: session.userId,
      status: WorkEntryEditRequestStatus.PENDING,
    },
    select: {
      id: true,
    },
  });

  if (existingPending) {
    return NextResponse.json(
      {
        ok: false,
        error: "Für diesen Eintrag existiert bereits eine offene Änderungsanfrage.",
      },
      { status: 409 }
    );
  }

  const [
    activityTranslation,
    locationTranslation,
    noteTranslation,
    reasonTranslation,
  ] = await Promise.all([
    translateOptionalText(requestedActivity),
    translateOptionalText(requestedLocation),
    translateOptionalText(requestedNoteEmployee),
    translateOptionalText(reason),
  ]);

  const created = await prisma.workEntryEditRequest.create({
    data: {
      userId: session.userId,
      workEntryId: entry.id,
      requestedWorkDate: dateOnlyUTC(requestedWorkDate),
      requestedStartTime: timeOnlyUTC(requestedStartTime),
      requestedEndTime: timeOnlyUTC(requestedEndTime),
      requestedActivity,
      requestedActivitySourceLanguage: activityTranslation.sourceLanguage,
      requestedActivityTranslations: activityTranslation.translations,
      requestedLocation,
      requestedLocationSourceLanguage: locationTranslation.sourceLanguage,
      requestedLocationTranslations: locationTranslation.translations,
      requestedTravelMinutes,
      requestedNoteEmployee: requestedNoteEmployee || null,
      requestedNoteSourceLanguage: noteTranslation.sourceLanguage,
      requestedNoteTranslations: noteTranslation.translations,
      reason,
      reasonSourceLanguage: reasonTranslation.sourceLanguage,
      reasonTranslations: reasonTranslation.translations,
      status: WorkEntryEditRequestStatus.PENDING,
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });

  await sendLocalizedPushToAdmins({
    companyId: session.companyId,
    url: buildPushUrl("/admin/aenderungsanfragen"),
    title: (adminLanguage) =>
      translate(adminLanguage, "newWorkEntryEditRequestPushTitle", TIME_ENTRY_CORRECTION_API_TEXTS),
    body: (adminLanguage) =>
      translate(adminLanguage, "newWorkEntryEditRequestPushBody", TIME_ENTRY_CORRECTION_API_TEXTS)
        .replace("{name}", session.fullName)
        .replace("{dateLabel}", existingWorkDateYMD),
  });

  return NextResponse.json({
    ok: true,
    request: {
      id: created.id,
      status: created.status,
      createdAt: created.createdAt.toISOString(),
    },
  });
}