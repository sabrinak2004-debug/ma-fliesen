import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { Prisma } from "@prisma/client";

function parseYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function extractUserId(session: unknown): string | null {
  if (!session || typeof session !== "object") return null;

  if ("user" in session) {
    const user = (session as { user?: unknown }).user;
    if (
      user &&
      typeof user === "object" &&
      "id" in user &&
      typeof (user as { id: unknown }).id === "string"
    ) {
      return (user as { id: string }).id;
    }
  }

  if ("userId" in session && typeof (session as { userId?: unknown }).userId === "string") {
    return (session as { userId: string }).userId;
  }

  if ("id" in session && typeof (session as { id?: unknown }).id === "string") {
    return (session as { id: string }).id;
  }

  return null;
}

type SupportedLang = "DE" | "EN" | "IT" | "TR" | "SQ" | "KU";
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
    language === "KU"
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

export async function GET(req: Request) {
  const session = await getSession();
  const sessionUserId = extractUserId(session);

  if (!sessionUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.appUser.findUnique({
    where: { id: sessionUserId },
    select: {
      id: true,
      role: true,
      isActive: true,
      companyId: true,
    },
  });

  if (!me || !me.isActive) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const userIdParam = url.searchParams.get("userId");

  if (!from || !to) {
    return NextResponse.json({ error: "from/to missing" }, { status: 400 });
  }

  const start = parseYMD(from);
  const end = parseYMD(to);

  let targetUserId = sessionUserId;

  if (me.role === Role.ADMIN && userIdParam) {
    const targetUser = await prisma.appUser.findFirst({
      where: {
        id: userIdParam,
        companyId: me.companyId,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
        fullName: true,
      },
    });

    if (!targetUser || !targetUser.isActive || targetUser.role !== Role.EMPLOYEE) {
      return NextResponse.json({ error: "Mitarbeiter nicht gefunden" }, { status: 404 });
    }

    targetUserId = targetUser.id;
  }

  const entries = await prisma.planEntry.findMany({
    where: {
      userId: targetUserId,
      workDate: { gte: start, lt: end },
    },
    orderBy: [{ startHHMM: "asc" }],
    select: {
      id: true,
      userId: true,
      workDate: true,
      startHHMM: true,
      endHHMM: true,
      activity: true,
      activityTranslations: true,
      location: true,
      locationTranslations: true,
      travelMinutes: true,
      noteEmployee: true,
      noteEmployeeTranslations: true,
      noteAdmin: true,
      noteAdminTranslations: true,
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  return NextResponse.json({
    entries: entries.map((entry) => ({
      ...entry,
      activity: getTranslatedText(
        entry.activity,
        entry.activityTranslations,
        session?.language ?? "DE"
      ),
      location: getTranslatedText(
        entry.location,
        entry.locationTranslations,
        session?.language ?? "DE"
      ),
      noteEmployee: getTranslatedText(
        entry.noteEmployee,
        entry.noteEmployeeTranslations,
        session?.language ?? "DE"
      ),
      noteAdmin: getTranslatedText(
        entry.noteAdmin,
        entry.noteAdminTranslations,
        session?.language ?? "DE"
      ),
    })),
  });
}