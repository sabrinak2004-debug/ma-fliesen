import { NextResponse } from "next/server";
import { Prisma, Role, WorkEntryChangeAction } from "@prisma/client";
import { type SupportedLang } from "@/lib/translate";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ChangeReportDTO = {
  id: string;
  action: WorkEntryChangeAction;
  entryWorkDate: string;
  entryStartHHMM: string;
  entryEndHHMM: string;
  reason: string;
  changeDescription: string;
  createdAt: string;
  changedBy: {
    id: string;
    fullName: string;
  };
  oldValues: Prisma.JsonValue;
  newValues: Prisma.JsonValue | null;
};

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
  originalText: string,
  translations: Prisma.JsonValue | null | undefined,
  language: string | null | undefined
): string {
  const targetLanguage = toSupportedLang(language);

  if (!isTranslationMap(translations)) {
    return originalText;
  }

  const translated = translations[targetLanguage];

  return typeof translated === "string" && translated.trim()
    ? translated
    : originalText;
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
    },
  });

  const result: ChangeReportDTO[] = reports.map((report) => ({
    id: report.id,
    action: report.action,
    entryWorkDate: report.entryWorkDate.toISOString().slice(0, 10),
    entryStartHHMM: report.entryStartHHMM,
    entryEndHHMM: report.entryEndHHMM,
    reason: getTranslatedText(
      report.reason,
      report.reasonTranslations,
      session.language
    ),
    changeDescription: getTranslatedText(
      report.changeDescription,
      report.changeDescriptionTranslations,
      session.language
    ),
    createdAt: report.createdAt.toISOString(),
    changedBy: {
      id: report.changedByUser.id,
      fullName: report.changedByUser.fullName,
    },
    oldValues: report.oldValues,
    newValues: report.newValues,
  }));

  return NextResponse.json({ reports: result });
}