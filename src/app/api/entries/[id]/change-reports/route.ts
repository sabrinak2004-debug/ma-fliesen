import { NextResponse } from "next/server";
import { Prisma, Role, WorkEntryChangeAction } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type SupportedLang } from "@/lib/translate";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ChangeReportDTO = {
  id: string;
  action: WorkEntryChangeAction;
  reason: string;
  createdAt: string;
  changedBy: {
    id: string;
    fullName: string;
  };
  approvedBy: {
    id: string;
    fullName: string;
  } | null;
  oldValues: Prisma.JsonValue;
  newValues: Prisma.JsonValue | null;
};

type TranslationMap = Partial<Record<SupportedLang, string>>;

const TRANSLATABLE_SNAPSHOT_FIELDS = new Set([
  "activity",
  "location",
  "noteEmployee",
]);

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

function isJsonRecord(value: Prisma.JsonValue | null | undefined): value is Prisma.JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTranslationMap(value: unknown): value is TranslationMap {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getTranslatedText(
  originalText: string,
  translations: unknown,
  language: SupportedLang
): string {
  if (!isTranslationMap(translations)) {
    return originalText;
  }

  const translated = translations[language];
  return typeof translated === "string" && translated.trim() ? translated : originalText;
}

function translateSnapshotFieldValue(args: {
  fieldKey: string;
  value: Prisma.JsonValue | undefined;
  language: SupportedLang;
}): Prisma.JsonValue {
  if (args.value === undefined) {
    return null;
  }

  if (!TRANSLATABLE_SNAPSHOT_FIELDS.has(args.fieldKey)) {
    return args.value;
  }

  if (!isJsonRecord(args.value)) {
    return args.value;
  }

  const rawValue = args.value["value"];
  const translations = args.value["translations"];

  if (typeof rawValue !== "string") {
    return args.value;
  }

  return getTranslatedText(rawValue, translations, args.language);
}

function translateSnapshotValues(
  snapshot: Prisma.JsonValue,
  language: SupportedLang
): Prisma.JsonValue {
  if (!isJsonRecord(snapshot)) {
    return snapshot;
  }

  const translated: Prisma.JsonObject = {};

  for (const [key, value] of Object.entries(snapshot)) {
    translated[key] = translateSnapshotFieldValue({
      fieldKey: key,
      value,
      language,
    });
  }

  return translated;
}

export async function GET(
  _req: Request,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const { id } = await context.params;

  const entry = await prisma.workEntry.findFirst({
    where: {
      id,
      user: {
        companyId: session.companyId,
        ...(session.role === Role.ADMIN ? {} : { id: session.userId }),
      },
    },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!entry) {
    return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 404 });
  }

  const reports = await prisma.workEntryChangeReport.findMany({
    where: {
      workEntryId: entry.id,
      targetUser: {
        companyId: session.companyId,
      },
      ...(session.role === Role.ADMIN ? {} : { targetUserId: session.userId }),
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      changedByUser: {
        select: {
          id: true,
          fullName: true,
        },
      },
      approvedByUser: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  const reportLanguage = toSupportedLang(session.language);

  const result: ChangeReportDTO[] = reports.map((report) => ({
    id: report.id,
    action: report.action,
    reason: getTranslatedText(
      report.reason,
      report.reasonTranslations,
      reportLanguage
    ),
    createdAt: report.createdAt.toISOString(),
    changedBy: {
      id: report.changedByUser.id,
      fullName: report.changedByUser.fullName,
    },
    approvedBy: report.approvedByUser
      ? {
          id: report.approvedByUser.id,
          fullName: report.approvedByUser.fullName,
        }
      : null,
    oldValues: translateSnapshotValues(report.oldValues, reportLanguage),
    newValues:
      report.newValues === null
        ? null
        : translateSnapshotValues(report.newValues, reportLanguage),
  }));

  return NextResponse.json({ reports: result });
}