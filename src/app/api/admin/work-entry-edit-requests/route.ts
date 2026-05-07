import { NextResponse } from "next/server";
import { Prisma, WorkEntryEditRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import type { SupportedLang } from "@/lib/translate";

function isWorkEntryEditRequestStatus(value: string): value is WorkEntryEditRequestStatus {
  return value === "PENDING" || value === "APPROVED" || value === "REJECTED";
}

function toIsoDateUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toHHMMUTC(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

type TranslationMap = Partial<Record<SupportedLang, string>>;

function isTranslationMap(value: Prisma.JsonValue | null | undefined): value is TranslationMap {
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

function getTranslatedText(args: {
  originalText: string | null | undefined;
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

function mapRequest(
  request: {
    id: string;
    status: WorkEntryEditRequestStatus;
    requestedWorkDate: Date;
    requestedStartTime: Date;
    requestedEndTime: Date;
    requestedActivity: string;
    requestedActivityTranslations: Prisma.JsonValue | null;
    requestedLocation: string;
    requestedLocationTranslations: Prisma.JsonValue | null;
    requestedTravelMinutes: number;
    requestedNoteEmployee: string | null;
    requestedNoteTranslations: Prisma.JsonValue | null;
    reason: string;
    reasonTranslations: Prisma.JsonValue | null;
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
    workEntry: {
      id: string;
      workDate: Date;
      startTime: Date;
      endTime: Date;
      activity: string;
      activityTranslations: Prisma.JsonValue | null;
      location: string;
      locationTranslations: Prisma.JsonValue | null;
      travelMinutes: number;
      noteEmployee: string | null;
      noteEmployeeTranslations: Prisma.JsonValue | null;
    };
  },
  language: string | null | undefined
) {
  return {
    id: request.id,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    decidedAt: request.decidedAt ? request.decidedAt.toISOString() : null,
    user: {
      id: request.user.id,
      fullName: request.user.fullName,
    },
    decidedBy: request.decidedBy
      ? {
          id: request.decidedBy.id,
          fullName: request.decidedBy.fullName,
        }
      : null,
    reason: getTranslatedText({
      originalText: request.reason,
      translations: request.reasonTranslations,
      language,
    }),
    noteAdmin: getTranslatedText({
      originalText: request.noteAdmin,
      translations: request.noteAdminTranslations,
      language,
    }),
    currentEntry: {
      id: request.workEntry.id,
      workDate: toIsoDateUTC(request.workEntry.workDate),
      startTime: toHHMMUTC(request.workEntry.startTime),
      endTime: toHHMMUTC(request.workEntry.endTime),
      activity: getTranslatedText({
        originalText: request.workEntry.activity,
        translations: request.workEntry.activityTranslations,
        language,
      }),
      location: getTranslatedText({
        originalText: request.workEntry.location,
        translations: request.workEntry.locationTranslations,
        language,
      }),
      travelMinutes: request.workEntry.travelMinutes,
      noteEmployee: getTranslatedText({
        originalText: request.workEntry.noteEmployee,
        translations: request.workEntry.noteEmployeeTranslations,
        language,
      }),
    },
    requestedEntry: {
      workDate: toIsoDateUTC(request.requestedWorkDate),
      startTime: toHHMMUTC(request.requestedStartTime),
      endTime: toHHMMUTC(request.requestedEndTime),
      activity: getTranslatedText({
        originalText: request.requestedActivity,
        translations: request.requestedActivityTranslations,
        language,
      }),
      location: getTranslatedText({
        originalText: request.requestedLocation,
        translations: request.requestedLocationTranslations,
        language,
      }),
      travelMinutes: request.requestedTravelMinutes,
      noteEmployee: getTranslatedText({
        originalText: request.requestedNoteEmployee,
        translations: request.requestedNoteTranslations,
        language,
      }),
    },
  };
}

export async function GET(req: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const adminUser = await prisma.appUser.findUnique({
    where: { id: admin.id },
    select: { language: true },
  });

  const { searchParams } = new URL(req.url);
  const statusParam = (searchParams.get("status") ?? "").trim();
  const userIdParam = (searchParams.get("userId") ?? "").trim();

  const where: Prisma.WorkEntryEditRequestWhereInput = {
    user: {
      companyId: admin.companyId,
    },
  };

  if (statusParam) {
    if (!isWorkEntryEditRequestStatus(statusParam)) {
      return NextResponse.json(
        { ok: false, error: "INVALID_STATUS" },
        { status: 400 }
      );
    }

    where.status = statusParam;
  }

  if (userIdParam) {
    where.userId = userIdParam;
  }

  const requests = await prisma.workEntryEditRequest.findMany({
    where,
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
      workEntry: {
        select: {
          id: true,
          workDate: true,
          startTime: true,
          endTime: true,
          activity: true,
          activityTranslations: true,
          location: true,
          locationTranslations: true,
          travelMinutes: true,
          noteEmployee: true,
          noteEmployeeTranslations: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const language = adminUser?.language ?? "DE";

  const mappedRequests = requests.map((request) => mapRequest(request, language));

  return NextResponse.json({
    ok: true,
    requests: mappedRequests,
    grouped: {
      pending: mappedRequests.filter((request) => request.status === "PENDING"),
      approved: mappedRequests.filter((request) => request.status === "APPROVED"),
      rejected: mappedRequests.filter((request) => request.status === "REJECTED"),
    },
  });
}