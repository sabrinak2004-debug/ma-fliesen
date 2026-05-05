import { NextResponse } from "next/server";
import { Prisma, Role, TaskRequiredAction, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  assertEmployeeMayEditDate,
  berlinTodayYMD,
  consumeTimeEntryUnlock,
} from "@/lib/timesheetLock";
import { computeDayBreakFromGross } from "@/lib/breaks";
import { translateAllLanguages, type SupportedLang } from "@/lib/translate";
import {
  ADMIN_TASKS_UI_TEXTS,
  ERFASSUNG_DICTIONARY,
  translate,
  type AdminTasksTextKey,
  type AppUiLanguage,
} from "@/lib/i18n";

function dateOnly(yyyyMmDd: string) {
  const [year, month, day] = yyyyMmDd.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

function timeOnly(hhmm: string) {
  return new Date(`1970-01-01T${hhmm}:00.000Z`);
}

function toIsoDateUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toHHMMUTC(d: Date) {
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function getNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
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

function toAppUiLanguage(value: string | null | undefined): AppUiLanguage {
  if (
    value === "DE" ||
    value === "EN" ||
    value === "IT" ||
    value === "TR" ||
    value === "SQ" ||
    value === "KU" ||
    value === "RO"
  ) {
    return value;
  }

  return "DE";
}

function translateEntryText(
  language: AppUiLanguage,
  key: AdminTasksTextKey
): string {
  return translate(language, key, ADMIN_TASKS_UI_TEXTS);
}

function formatDateForLanguage(language: AppUiLanguage, iso: string): string {
  const normalized = iso.length >= 10 ? iso.slice(0, 10) : iso;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return iso;
  }

  const [year, month, day] = normalized.split("-");

  switch (language) {
    case "EN":
      return `${month}/${day}/${year}`;
    case "IT":
      return `${day}/${month}/${year}`;
    case "TR":
      return `${day}.${month}.${year}`;
    case "SQ":
      return `${day}.${month}.${year}`;
    case "KU":
      return `${day}.${month}.${year}`;
    case "RO":
      return `${day}.${month}.${year}`;
    case "DE":
    default:
      return `${day}.${month}.${year}`;
  }
}

function translateTimesheetLockError(
  language: AppUiLanguage,
  error: unknown,
  fallback: string
): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  if (error.message === "TIME_ENTRY_FUTURE_DATE_EDIT_FORBIDDEN") {
    return translate(language, "timesheetFutureDateEditForbidden", ERFASSUNG_DICTIONARY);
  }

  if (error.message === "TIME_ENTRY_LOCKED_DAY_REQUIRES_CORRECTION") {
    return translate(language, "timesheetLockedDayRequiresCorrection", ERFASSUNG_DICTIONARY);
  }

  if (error.message.startsWith("TIME_ENTRY_OLDER_MISSING_ENTRIES_FIRST:")) {
    const missingDate = error.message.slice("TIME_ENTRY_OLDER_MISSING_ENTRIES_FIRST:".length).trim();

    return translate(language, "timesheetOlderMissingEntriesFirst", ERFASSUNG_DICTIONARY)
      .replace("{date}", formatDateForLanguage(language, missingDate || ""));
  }

  return error.message || fallback;
}

type EntryBody = {
  id?: unknown;
  userId?: unknown;
  workDate?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  activity?: unknown;
  location?: unknown;
  travelMinutes?: unknown;
  noteEmployee?: unknown;
  sourceTaskId?: unknown;
};

type EntryDTO = {
  id: string;
  workDate: string;
  startTime: string;
  endTime: string;
  activity: string;
  location: string;
  travelMinutes: number;
  workMinutes: number;
  grossMinutes: number;
  breakMinutes: number;
  breakAuto: boolean;
  noteEmployee: string;
  user: { id: string; fullName: string };
};

type DayBreakDTO = {
  id: string;
  workDate: string;
  breakStartHHMM: string | null;
  breakEndHHMM: string | null;
  manualMinutes: number;
  legalMinutes: number;
  autoSupplementMinutes: number;
  effectiveMinutes: number;
};

async function findActiveCompanyUser(userId: string, companyId: string) {
  return prisma.appUser.findFirst({
    where: {
      id: userId,
      companyId,
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      isActive: true,
    },
  });
}

function addUtcDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

type AdminTaskBypassRange = {
  taskId: string;
  startDate: string;
  endDate: string;
};

async function findAdminTaskBypassRange(args: {
  sourceTaskId: string;
  userId: string;
  companyId: string;
  workDateYMD: string;
}): Promise<AdminTaskBypassRange | null> {
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
      referenceDate: true,
      referenceStartDate: true,
      referenceEndDate: true,
    },
  });

  if (!task) {
    return null;
  }

  const startDate = toIsoDateUTC(task.referenceStartDate ?? task.referenceDate ?? dateOnly(args.workDateYMD));
  const endDate = toIsoDateUTC(task.referenceEndDate ?? task.referenceStartDate ?? task.referenceDate ?? dateOnly(args.workDateYMD));

  if (args.workDateYMD < startDate || args.workDateYMD > endDate) {
    return null;
  }

  return {
    taskId: task.id,
    startDate,
    endDate,
  };
}

async function ensureTimeEntryUnlockRange(userId: string, startDate: string, endDate: string): Promise<void> {
  const updates: Prisma.PrismaPromise<unknown>[] = [];

  for (
    let current = dateOnly(startDate);
    current <= dateOnly(endDate);
    current = addUtcDays(current, 1)
  ) {
    updates.push(
      prisma.timeEntryUnlock.upsert({
        where: {
          userId_workDate: {
            userId,
            workDate: current,
          },
        },
        update: {
          usedAt: null,
          expiresAt: null,
        },
        create: {
          userId,
          workDate: current,
          usedAt: null,
          expiresAt: null,
        },
      })
    );
  }

  await prisma.$transaction(updates);
}

type WorkEntryRow = {
  id: string;
  userId: string;
  workDate: Date;
  startTime: Date;
  endTime: Date;
  activity: string;
  activitySourceLanguage: string | null;
  activityTranslations: Prisma.JsonValue | null;
  location: string;
  locationSourceLanguage: string | null;
  locationTranslations: Prisma.JsonValue | null;
  travelMinutes: number;
  workMinutes: number;
  grossMinutes: number;
  breakMinutes: number;
  breakAuto: boolean;
  noteEmployee: string | null;
  noteEmployeeSourceLanguage: string | null;
  noteEmployeeTranslations: Prisma.JsonValue | null;
  user: {
    id: string;
    fullName: string;
  };
};

async function syncDailyBreakAllocation(userId: string, workDateYMD: string) {
  const workDate = dateOnly(workDateYMD);

  const [entries, existingDayBreak] = await prisma.$transaction([
    prisma.workEntry.findMany({
      where: { userId, workDate },
      orderBy: [{ endTime: "asc" }, { startTime: "asc" }],
      select: { id: true, grossMinutes: true },
    }),
    prisma.dayBreak.findUnique({
      where: { userId_workDate: { userId, workDate } },
    }),
  ]);

  if (entries.length === 0) {
    if (existingDayBreak) {
      await prisma.dayBreak.delete({
        where: { userId_workDate: { userId, workDate } },
      });
    }
    return;
  }

  const dayGross = entries.reduce((sum, entry) => sum + Math.max(0, entry.grossMinutes), 0);
  const manualMinutes = existingDayBreak?.manualMinutes ?? 0;
  const result = computeDayBreakFromGross(dayGross, manualMinutes);

  if (existingDayBreak) {
    await prisma.dayBreak.update({
      where: { userId_workDate: { userId, workDate } },
      data: {
        legalMinutes: result.legalBreakMinutes,
        autoSupplementMinutes: result.autoSupplementMinutes,
        effectiveMinutes: result.effectiveBreakMinutes,
      },
    });
  } else {
    await prisma.dayBreak.create({
      data: {
        userId,
        workDate,
        breakStartHHMM: null,
        breakEndHHMM: null,
        manualMinutes: 0,
        legalMinutes: result.legalBreakMinutes,
        autoSupplementMinutes: result.autoSupplementMinutes,
        effectiveMinutes: result.effectiveBreakMinutes,
      },
    });
  }

  const updates: Prisma.PrismaPromise<unknown>[] = [];
  let remainingBreak = result.effectiveBreakMinutes;

  const reversedEntries = [...entries].reverse();

  for (const entry of reversedEntries) {
    const gross = Math.max(0, entry.grossMinutes);
    const allocatedBreak = Math.min(gross, remainingBreak);
    remainingBreak -= allocatedBreak;

    updates.push(
      prisma.workEntry.update({
        where: { id: entry.id },
        data: {
          breakMinutes: allocatedBreak,
          breakAuto: allocatedBreak > 0 ? result.breakAuto : false,
          workMinutes: Math.max(0, gross - allocatedBreak),
        },
      })
    );
  }

  await prisma.$transaction(updates);
}

function buildPatchedEntries(rows: WorkEntryRow[], dayBreakMap: Map<string, DayBreakDTO>) {
  const groups = new Map<string, WorkEntryRow[]>();

  for (const row of rows) {
    const ymd = toIsoDateUTC(row.workDate);
    const key = `${row.userId}|${ymd}`;
    const arr = groups.get(key) ?? [];
    arr.push(row);
    groups.set(key, arr);
  }

  const patched = new Map<
    string,
    {
      grossMinutes: number;
      breakMinutes: number;
      breakAuto: boolean;
      workMinutes: number;
    }
  >();

  for (const [key, arr] of groups.entries()) {
    const ymd = key.split("|")[1];
    const dayBreak = dayBreakMap.get(key);

    const dayGross = arr.reduce((sum, row) => sum + Math.max(0, row.grossMinutes), 0);
    const manualMinutes = dayBreak?.manualMinutes ?? 0;
    const result = computeDayBreakFromGross(dayGross, manualMinutes);

    const sortedAsc = [...arr].sort((a, b) => {
      const endDiff = a.endTime.getTime() - b.endTime.getTime();
      if (endDiff !== 0) return endDiff;
      return a.startTime.getTime() - b.startTime.getTime();
    });

    for (const row of sortedAsc) {
      const gross = Math.max(0, row.grossMinutes);
      patched.set(row.id, {
        grossMinutes: gross,
        breakMinutes: 0,
        breakAuto: false,
        workMinutes: gross,
      });
    }

    let remainingBreak = result.effectiveBreakMinutes;
    const reversedEntries = [...sortedAsc].reverse();

    for (const row of reversedEntries) {
      const current = patched.get(row.id);
      if (!current) continue;

      const allocatedBreak = Math.min(current.grossMinutes, remainingBreak);
      remainingBreak -= allocatedBreak;

      patched.set(row.id, {
        grossMinutes: current.grossMinutes,
        breakMinutes: allocatedBreak,
        breakAuto: allocatedBreak > 0 ? result.breakAuto : false,
        workMinutes: Math.max(0, current.grossMinutes - allocatedBreak),
      });
    }

    if (!dayBreakMap.has(key)) {
      dayBreakMap.set(key, {
        id: `virtual-${key}`,
        workDate: ymd,
        breakStartHHMM: null,
        breakEndHHMM: null,
        manualMinutes: 0,
        legalMinutes: result.legalBreakMinutes,
        autoSupplementMinutes: result.autoSupplementMinutes,
        effectiveMinutes: result.effectiveBreakMinutes,
      });
    }
  }

  return patched;
}

export async function GET(req: Request) {
  const session = await getSession();
  const language = toAppUiLanguage(session?.language);

  if (!session) {
    return NextResponse.json(
      { error: translateEntryText(language, "notLoggedIn") },
      { status: 401 }
    );
  }
  const isAdmin = session.role === Role.ADMIN;
  const userWhere = isAdmin
    ? { user: { companyId: session.companyId } }
    : { userId: session.userId };

  const url = new URL(req.url);
  const month = url.searchParams.get("month");

  let from: Date | undefined;
  let to: Date | undefined;

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [yStr, mStr] = month.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
    to = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  }

  const rows = await prisma.workEntry.findMany({
    where: {
      ...userWhere,
      ...(from && to ? { workDate: { gte: from, lt: to } } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: [{ workDate: "desc" }, { startTime: "desc" }],
  });

  const dayBreakRows = await prisma.dayBreak.findMany({
    where: {
      ...userWhere,
      ...(from && to ? { workDate: { gte: from, lt: to } } : {}),
    },
    orderBy: [{ workDate: "desc" }],
  });

  const dayBreakMap = new Map<string, DayBreakDTO>();

  for (const row of dayBreakRows) {
    const key = `${row.userId}|${toIsoDateUTC(row.workDate)}`;
    dayBreakMap.set(key, {
      id: row.id,
      workDate: toIsoDateUTC(row.workDate),
      breakStartHHMM: row.breakStartHHMM,
      breakEndHHMM: row.breakEndHHMM,
      manualMinutes: row.manualMinutes,
      legalMinutes: row.legalMinutes,
      autoSupplementMinutes: row.autoSupplementMinutes,
      effectiveMinutes: row.effectiveMinutes,
    });
  }

  const typedRows: WorkEntryRow[] = rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    workDate: row.workDate,
    startTime: row.startTime,
    endTime: row.endTime,
    activity: row.activity ?? "",
    activitySourceLanguage: row.activitySourceLanguage ?? null,
    activityTranslations: row.activityTranslations ?? null,
    location: row.location ?? "",
    locationSourceLanguage: row.locationSourceLanguage ?? null,
    locationTranslations: row.locationTranslations ?? null,
    travelMinutes: row.travelMinutes ?? 0,
    workMinutes: row.workMinutes ?? 0,
    grossMinutes: row.grossMinutes ?? 0,
    breakMinutes: row.breakMinutes ?? 0,
    breakAuto: row.breakAuto ?? false,
    noteEmployee: row.noteEmployee ?? "",
    noteEmployeeSourceLanguage: row.noteEmployeeSourceLanguage ?? null,
    noteEmployeeTranslations: row.noteEmployeeTranslations ?? null,
    user: {
      id: row.user.id,
      fullName: row.user.fullName,
    },
  }));

  const patched = buildPatchedEntries(typedRows, dayBreakMap);

  const entries: EntryDTO[] = typedRows.map((row) => {
    const p = patched.get(row.id);

    return {
      id: row.id,
      workDate: toIsoDateUTC(row.workDate),
      startTime: toHHMMUTC(row.startTime),
      endTime: toHHMMUTC(row.endTime),
      activity: getTranslatedText(
        row.activity,
        row.activityTranslations,
        session.language
      ),
      location: getTranslatedText(
        row.location,
        row.locationTranslations,
        session.language
      ),
      travelMinutes: row.travelMinutes,
      grossMinutes: p?.grossMinutes ?? row.grossMinutes,
      breakMinutes: p?.breakMinutes ?? row.breakMinutes,
      breakAuto: p?.breakAuto ?? row.breakAuto,
      workMinutes: p?.workMinutes ?? row.workMinutes,
      noteEmployee: getTranslatedText(
        row.noteEmployee,
        row.noteEmployeeTranslations,
        session.language
      ),
      user: {
        id: row.user.id,
        fullName: row.user.fullName,
      },
    };
  });

  const dayBreaks = Array.from(dayBreakMap.values()).sort((a, b) => (a.workDate === b.workDate ? 0 : a.workDate > b.workDate ? -1 : 1));

  return NextResponse.json({ entries, dayBreaks });
}

export async function POST(req: Request) {
  const session = await getSession();
  const language = toAppUiLanguage(session?.language);

  if (!session) {
    return NextResponse.json(
      { error: translateEntryText(language, "notLoggedIn") },
      { status: 401 }
    );
  }

  const isAdmin = session.role === Role.ADMIN;
  const raw = (await req.json().catch(() => null)) as unknown;
  const body: EntryBody = isRecord(raw) ? raw : {};

  const workDate = getString(body.workDate).trim();
  const startTime = getString(body.startTime).trim();
  const endTime = getString(body.endTime).trim();
  const activity = getString(body.activity).trim();
  const location = getString(body.location).trim();
  const noteEmployee = getString(body.noteEmployee).trim();
  const sourceTaskId = getString(body.sourceTaskId).trim();

  if (!workDate || !startTime || !endTime || !activity) {
    return NextResponse.json(
      { error: translateEntryText(language, "invalidData") },
      { status: 400 }
    );
  }

  if (!location) {
    return NextResponse.json(
      { error: translate(language, "enterLocation", ERFASSUNG_DICTIONARY) },
      { status: 400 }
    );
  }

  const adminTaskBypass = !isAdmin
    ? await findAdminTaskBypassRange({
        sourceTaskId,
        userId: session.userId,
        companyId: session.companyId,
        workDateYMD: workDate,
      })
    : null;

  if (adminTaskBypass) {
    await ensureTimeEntryUnlockRange(
      session.userId,
      adminTaskBypass.startDate,
      adminTaskBypass.endDate
    );
  } else {
    try {
      await assertEmployeeMayEditDate({
        role: session.role,
        userId: session.userId,
        workDateYMD: workDate,
        companyId: session.companyId,
      });
    } catch (error: unknown) {
      const message = translateTimesheetLockError(
        language,
        error,
        translateEntryText(language, "notAllowed")
      );

      return NextResponse.json({ error: message }, { status: 403 });
    }
  }

  const start = timeOnly(startTime);
  const end = timeOnly(endTime);
  const diffMin = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const travelMinutesNum = Math.max(0, Math.round(getNumber(body.travelMinutes)));

  let targetUserId = session.userId;

  if (isAdmin) {
    const requestedUserId = getString(body.userId).trim();
    if (requestedUserId) {
      const user = await findActiveCompanyUser(requestedUserId, session.companyId);
      if (!user) {
        return NextResponse.json(
          { error: translateEntryText(language, "employeeNotFoundOrInactive") },
          { status: 400 }
        );
      }
      targetUserId = user.id;
    }
  }

  let noteEmployeeSourceLanguage: SupportedLang | null = null;
  let noteEmployeeTranslations: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
    Prisma.JsonNull;

  if (noteEmployee) {
    try {
      const translationResult = await translateAllLanguages(noteEmployee);
      noteEmployeeSourceLanguage = translationResult.sourceLanguage;
      noteEmployeeTranslations = toPrismaNullableJsonInput(
        translationResult.translations
      );
    } catch (error) {
      console.error("Translation for noteEmployee failed:", error);
    }
  }

let activitySourceLanguage: SupportedLang | null = null;
let activityTranslations: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
  Prisma.JsonNull;

if (activity) {
  try {
    const translationResult = await translateAllLanguages(activity);
    activitySourceLanguage = translationResult.sourceLanguage;
    activityTranslations = toPrismaNullableJsonInput(
      translationResult.translations
    );
  } catch (error) {
    console.error("Translation for activity failed:", error);
  }
}

let locationSourceLanguage: SupportedLang | null = null;
let locationTranslations: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
  Prisma.JsonNull;

if (location) {
  try {
    const translationResult = await translateAllLanguages(location);
    locationSourceLanguage = translationResult.sourceLanguage;
    locationTranslations = toPrismaNullableJsonInput(
      translationResult.translations
    );
  } catch (error) {
    console.error("Translation for location failed:", error);
  }
}

  const created = await prisma.workEntry.create({
    data: {
      userId: targetUserId,
      workDate: dateOnly(workDate),
      startTime: timeOnly(startTime),
      endTime: timeOnly(endTime),
      activity,
      activitySourceLanguage,
      activityTranslations,
      location,
      locationSourceLanguage,
      locationTranslations,
      travelMinutes: travelMinutesNum,
      grossMinutes: diffMin,
      breakMinutes: 0,
      breakAuto: false,
      workMinutes: diffMin,
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
    },
  });

  await syncDailyBreakAllocation(targetUserId, workDate);

  if (!isAdmin && workDate !== berlinTodayYMD()) {
    await consumeTimeEntryUnlock(session.userId, workDate);
  }

  const createdFresh = await prisma.workEntry.findUnique({
    where: { id: created.id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  if (!createdFresh) {
    return NextResponse.json(
      { error: translateEntryText(language, "entryNotFound") },
      { status: 500 }
    );
  }

  const entry: EntryDTO = {
    id: createdFresh.id,
    workDate: toIsoDateUTC(createdFresh.workDate),
    startTime: toHHMMUTC(createdFresh.startTime),
    endTime: toHHMMUTC(createdFresh.endTime),
    activity: getTranslatedText(
      createdFresh.activity,
      createdFresh.activityTranslations,
      session.language
    ),
    location: getTranslatedText(
      createdFresh.location,
      createdFresh.locationTranslations,
      session.language
    ),
    travelMinutes: createdFresh.travelMinutes ?? 0,
    workMinutes: createdFresh.workMinutes ?? 0,
    grossMinutes: createdFresh.grossMinutes ?? 0,
    breakMinutes: createdFresh.breakMinutes ?? 0,
    breakAuto: createdFresh.breakAuto ?? false,
    noteEmployee: getTranslatedText(
      createdFresh.noteEmployee,
      createdFresh.noteEmployeeTranslations,
      session.language
    ),
    user: { id: createdFresh.user.id, fullName: createdFresh.user.fullName },
  };

  return NextResponse.json({ entry });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  const language = toAppUiLanguage(session?.language);

  if (!session) {
    return NextResponse.json(
      { error: translateEntryText(language, "notLoggedIn") },
      { status: 401 }
    );
  }

  const isAdmin = session.role === Role.ADMIN;
  const raw = (await req.json().catch(() => null)) as unknown;
  const body: EntryBody = isRecord(raw) ? raw : {};

  const id = getString(body.id).trim();
  if (!id) {
    return NextResponse.json(
      { error: translateEntryText(language, "idMissing") },
      { status: 400 }
    );
  }

  const existing = await prisma.workEntry.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          isActive: true,
          companyId: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: translateEntryText(language, "notFound") },
      { status: 404 }
    );
  }

  if (existing.user.companyId !== session.companyId) {
    return NextResponse.json(
      { error: translateEntryText(language, "notAllowed") },
      { status: 403 }
    );
  }

  if (!isAdmin && existing.userId !== session.userId) {
    return NextResponse.json(
      { error: translateEntryText(language, "notAllowed") },
      { status: 403 }
    );
  }

  if (!isAdmin) {
    const existingYMD = toIsoDateUTC(existing.workDate);
    try {
      await assertEmployeeMayEditDate({
        role: session.role,
        userId: session.userId,
        workDateYMD: existingYMD,
        companyId: session.companyId,
      });
    } catch (error: unknown) {
      const message = translateTimesheetLockError(
        language,
        error,
        translateEntryText(language, "notAllowed")
      );

      return NextResponse.json({ error: message }, { status: 403 });
    }
  }

  const workDate = isAdmin ? toIsoDateUTC(existing.workDate) : getString(body.workDate).trim();
  const startTime = isAdmin ? toHHMMUTC(existing.startTime) : getString(body.startTime).trim();
  const endTime = isAdmin ? toHHMMUTC(existing.endTime) : getString(body.endTime).trim();

  const activity = isAdmin
    ? getString(body.activity).trim() || (existing.activity ?? "")
    : getString(body.activity).trim();

  const location = isAdmin
    ? getString(body.location).trim() || (existing.location ?? "")
    : getString(body.location).trim();

  const noteEmployee = isAdmin
    ? existing.noteEmployee ?? ""
    : getString(body.noteEmployee).trim();

  if (!isAdmin && (!workDate || !startTime || !endTime || !activity)) {
    return NextResponse.json(
      { error: translateEntryText(language, "invalidData") },
      { status: 400 }
    );
  }

  if (!isAdmin && !location) {
    return NextResponse.json(
      { error: translate(language, "enterLocation", ERFASSUNG_DICTIONARY) },
      { status: 400 }
    );
  }

  if (!isAdmin) {
    try {
      await assertEmployeeMayEditDate({
        role: session.role,
        userId: session.userId,
        workDateYMD: workDate,
        companyId: session.companyId,
      });
    } catch (error: unknown) {
      const message = translateTimesheetLockError(
        language,
        error,
        translateEntryText(language, "notAllowed")
      );

      return NextResponse.json({ error: message }, { status: 403 });
    }
  }

  const start = timeOnly(startTime);
  const end = timeOnly(endTime);
  const diffMin = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const travelMinutesNum = Math.max(0, Math.round(getNumber(body.travelMinutes)));

  let targetUserId = existing.userId;

  if (isAdmin) {
    const requestedUserId = getString(body.userId).trim();
    if (requestedUserId) {
      const user = await findActiveCompanyUser(requestedUserId, session.companyId);
      if (!user) {
        return NextResponse.json(
          { error: translateEntryText(language, "employeeNotFoundOrInactive") },
          { status: 400 }
        );
      }
      targetUserId = user.id;
    }
  }

  const oldWorkDateYMD = toIsoDateUTC(existing.workDate);
  const oldUserId = existing.userId;

  let nextNoteEmployeeSourceLanguage: SupportedLang | null =
    (existing.noteEmployeeSourceLanguage as SupportedLang | null) ?? null;

  let nextNoteEmployeeTranslations:
    | Prisma.InputJsonValue
    | Prisma.NullableJsonNullValueInput =
    existing.noteEmployeeTranslations === null
      ? Prisma.JsonNull
      : (existing.noteEmployeeTranslations as Prisma.InputJsonValue);

  if (!isAdmin) {
    if (noteEmployee) {
      try {
        const translationResult = await translateAllLanguages(noteEmployee);
        nextNoteEmployeeSourceLanguage = translationResult.sourceLanguage;
        nextNoteEmployeeTranslations = toPrismaNullableJsonInput(
          translationResult.translations
        );
      } catch (error) {
        console.error("Translation for noteEmployee failed:", error);
      }
    } else {
      nextNoteEmployeeSourceLanguage = null;
      nextNoteEmployeeTranslations = Prisma.JsonNull;
    }
  }

  let nextActivitySourceLanguage: SupportedLang | null =
    (existing.activitySourceLanguage as SupportedLang | null) ?? null;

  let nextActivityTranslations:
    | Prisma.InputJsonValue
    | Prisma.NullableJsonNullValueInput =
    existing.activityTranslations === null
      ? Prisma.JsonNull
      : (existing.activityTranslations as Prisma.InputJsonValue);

  if (activity) {
    try {
      const translationResult = await translateAllLanguages(activity);
      nextActivitySourceLanguage = translationResult.sourceLanguage;
      nextActivityTranslations = toPrismaNullableJsonInput(
        translationResult.translations
      );
    } catch (error) {
      console.error("Translation for activity failed:", error);
    }
  } else {
    nextActivitySourceLanguage = null;
    nextActivityTranslations = Prisma.JsonNull;
  }

  let nextLocationSourceLanguage: SupportedLang | null =
    (existing.locationSourceLanguage as SupportedLang | null) ?? null;

  let nextLocationTranslations:
    | Prisma.InputJsonValue
    | Prisma.NullableJsonNullValueInput =
    existing.locationTranslations === null
      ? Prisma.JsonNull
      : (existing.locationTranslations as Prisma.InputJsonValue);

  if (location) {
    try {
      const translationResult = await translateAllLanguages(location);
      nextLocationSourceLanguage = translationResult.sourceLanguage;
      nextLocationTranslations = toPrismaNullableJsonInput(
        translationResult.translations
      );
    } catch (error) {
      console.error("Translation for location failed:", error);
    }
  } else {
    nextLocationSourceLanguage = null;
    nextLocationTranslations = Prisma.JsonNull;
  }

  const updated = await prisma.workEntry.update({
    where: { id },
    data: {
      userId: targetUserId,
      workDate: dateOnly(workDate),
      startTime: timeOnly(startTime),
      endTime: timeOnly(endTime),
      activity,
      activitySourceLanguage: nextActivitySourceLanguage,
      activityTranslations: nextActivityTranslations,
      location,
      locationSourceLanguage: nextLocationSourceLanguage,
      locationTranslations: nextLocationTranslations,
      travelMinutes: travelMinutesNum,
      grossMinutes: diffMin,
      breakMinutes: 0,
      breakAuto: false,
      workMinutes: diffMin,
      noteEmployee: noteEmployee || null,
      noteEmployeeSourceLanguage: nextNoteEmployeeSourceLanguage,
      noteEmployeeTranslations: nextNoteEmployeeTranslations,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  await syncDailyBreakAllocation(targetUserId, workDate);

  if (!isAdmin && workDate !== berlinTodayYMD()) {
    await consumeTimeEntryUnlock(session.userId, workDate);
  }

  if (oldUserId !== targetUserId || oldWorkDateYMD !== workDate) {
    await syncDailyBreakAllocation(oldUserId, oldWorkDateYMD);
  }

  const updatedFresh = await prisma.workEntry.findUnique({
    where: { id: updated.id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  if (!updatedFresh) {
    return NextResponse.json(
      { error: translateEntryText(language, "entryNotFound") },
      { status: 500 }
    );
  }

  const entry: EntryDTO = {
    id: updatedFresh.id,
    workDate: toIsoDateUTC(updatedFresh.workDate),
    startTime: toHHMMUTC(updatedFresh.startTime),
    endTime: toHHMMUTC(updatedFresh.endTime),
    activity: getTranslatedText(
      updatedFresh.activity,
      updatedFresh.activityTranslations,
      session.language
    ),
    location: getTranslatedText(
      updatedFresh.location,
      updatedFresh.locationTranslations,
      session.language
    ),
    travelMinutes: updatedFresh.travelMinutes ?? 0,
    workMinutes: updatedFresh.workMinutes ?? 0,
    grossMinutes: updatedFresh.grossMinutes ?? 0,
    breakMinutes: updatedFresh.breakMinutes ?? 0,
    breakAuto: updatedFresh.breakAuto ?? false,
    noteEmployee: getTranslatedText(
      updatedFresh.noteEmployee,
      updatedFresh.noteEmployeeTranslations,
      session.language
    ),
    user: { id: updatedFresh.user.id, fullName: updatedFresh.user.fullName },
  };

  return NextResponse.json({ entry });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  const language = toAppUiLanguage(session?.language);

  if (!session) {
    return NextResponse.json(
      { error: translateEntryText(language, "notLoggedIn") },
      { status: 401 }
    );
  }

  const isAdmin = session.role === Role.ADMIN;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: translateEntryText(language, "idMissing") },
      { status: 400 }
    );
  }

  const entry = await prisma.workEntry.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          companyId: true,
        },
      },
    },
  });

  if (!entry) {
    return NextResponse.json(
      { error: translateEntryText(language, "notFound") },
      { status: 404 }
    );
  }

  if (entry.user.companyId !== session.companyId) {
    return NextResponse.json(
      { error: translateEntryText(language, "notAllowed") },
      { status: 403 }
    );
  }

  if (!isAdmin && entry.userId !== session.userId) {
    return NextResponse.json(
      { error: translateEntryText(language, "notAllowed") },
      { status: 403 }
    );
  }

  if (!isAdmin) {
    const ymd = toIsoDateUTC(entry.workDate);
    try {
      await assertEmployeeMayEditDate({
        role: session.role,
        userId: session.userId,
        workDateYMD: ymd,
        companyId: session.companyId,
      });
    } catch (error: unknown) {
      const message = translateTimesheetLockError(
        language,
        error,
        translateEntryText(language, "notAllowed")
      );

      return NextResponse.json({ error: message }, { status: 403 });
    }
  }

  const deleted = await prisma.workEntry.delete({ where: { id } });
  const ymd = toIsoDateUTC(deleted.workDate);
  await syncDailyBreakAllocation(deleted.userId, ymd);

  if (!isAdmin && ymd !== berlinTodayYMD()) {
    await consumeTimeEntryUnlock(session.userId, ymd);
  }

  return NextResponse.json({ ok: true });
}