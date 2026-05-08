// src/app/api/admin/dashboard/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  berlinTodayYMD,
  getMissingRequiredWorkDates,
  isWorkEntryRequiredOnDateForUserMeta,
} from "@/lib/timesheetLock";
import { computeDayBreakFromGross } from "@/lib/breaks";
import { Role, AbsenceType, Prisma } from "@prisma/client";
import type { SupportedLang } from "@/lib/translate";

function dateOnlyLocalIso(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function utcDayRange(ymd: string): { start: Date; endExclusive: Date } {
  const start = new Date(`${ymd}T00:00:00.000Z`);
  const endExclusive = new Date(start);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  return { start, endExclusive };
}

function startOfWeekMonday(d: Date) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const res = new Date(d);
  res.setDate(d.getDate() + diff);
  res.setHours(0, 0, 0, 0);
  return res;
}

function endOfWeekSunday(d: Date) {
  const start = startOfWeekMonday(d);
  const res = new Date(start);
  res.setDate(start.getDate() + 6);
  res.setHours(23, 59, 59, 999);
  return res;
}

function lastDayOfMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(y, m, 0);
  return String(last.getDate()).padStart(2, "0");
}

function toHHMMUTC(d: Date) {
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function absenceTypeToApi(type: AbsenceType): "VACATION" | "SICK" {
  return type === AbsenceType.VACATION ? "VACATION" : "SICK";
}

type TimelineDayBreak = {
  workDate: string;
  breakStartHHMM: string | null;
  breakEndHHMM: string | null;
  manualMinutes: number;
  legalMinutes: number;
  autoSupplementMinutes: number;
  effectiveMinutes: number;
};

type AttachmentDTO = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
};

type WorkEntryMonthRow = {
  id: string;
  userId: string;
  workDate: Date;
  startTime: Date;
  endTime: Date;
  activity: string | null;
  activityTranslations: Prisma.JsonValue | null;
  location: string | null;
  locationTranslations: Prisma.JsonValue | null;
  travelMinutes: number | null;
  breakMinutes: number | null;
  breakAuto: boolean | null;
  workMinutes: number | null;
  noteEmployee: string | null;
  noteEmployeeTranslations: Prisma.JsonValue | null;
  attachments: AttachmentDTO[];
};

function buildPatchedDashboardEntries(
  rows: WorkEntryMonthRow[],
  dayBreakMap: Map<string, TimelineDayBreak>
) {
  const groups = new Map<string, WorkEntryMonthRow[]>();

  for (const row of rows) {
    const ymd = dateOnlyLocalIso(new Date(row.workDate));
    const key = `${row.userId}:${ymd}`;
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
    const ymd = key.split(":")[1];
    const dayBreak = dayBreakMap.get(key);

    const dayGross = arr.reduce((sum, row) => {
      const startMs = row.startTime.getTime();
      const endMs = row.endTime.getTime();
      const gross = Math.max(0, Math.round((endMs - startMs) / 60000));
      return sum + gross;
    }, 0);

    const manualMinutes = dayBreak?.manualMinutes ?? 0;
    const result = computeDayBreakFromGross(dayGross, manualMinutes);

    const sortedAsc = [...arr].sort((a, b) => {
      const endDiff = a.endTime.getTime() - b.endTime.getTime();
      if (endDiff !== 0) return endDiff;
      return a.startTime.getTime() - b.startTime.getTime();
    });

    for (const row of sortedAsc) {
      const gross = Math.max(0, Math.round((row.endTime.getTime() - row.startTime.getTime()) / 60000));

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

type DashboardPersonRow = {
  userId: string;
  fullName: string;
};

type DashboardAbsenceRow = {
  userId: string;
  fullName: string;
  type: "VACATION" | "SICK";
};

type DashboardOverdueMissingRow = {
  userId: string;
  fullName: string;
  missingDatesCount: number;
  oldestMissingDate: string;
  newestMissingDate: string;
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
  if (!session) {
    return NextResponse.json({ ok: false, error: "NOT_AUTHENTICATED" }, { status: 401 });
  }

  if (session.role !== Role.ADMIN) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const now = new Date();
  const todayIso = berlinTodayYMD(now);
  const url = new URL(req.url);
  const monthParam = url.searchParams.get("month") ?? todayIso.slice(0, 7);

  if (!/^\d{4}-\d{2}$/.test(monthParam)) {
    return NextResponse.json({ ok: false, error: "INVALID_MONTH" }, { status: 400 });
  }

  const monthStartIso = `${monthParam}-01`;
  const monthEndIso = `${monthParam}-${lastDayOfMonth(monthParam)}`;

  const weekStart = startOfWeekMonday(now);
  const weekEnd = endOfWeekSunday(now);
  const todayRange = utcDayRange(todayIso);

  const employees = await prisma.appUser.findMany({
    where: {
      isActive: true,
      role: Role.EMPLOYEE,
      companyId: session.companyId,
    },
    select: { id: true, fullName: true, createdAt: true },
    orderBy: { fullName: "asc" },
  });

  const activeEmployeesToday: DashboardPersonRow[] = employees.map((employee) => ({
    userId: employee.id,
    fullName: employee.fullName,
  }));

  const employeesRequiredToday = employees.filter((employee) =>
    isWorkEntryRequiredOnDateForUserMeta({
      currentYMD: todayIso,
      fullName: employee.fullName,
      companySubdomain: session.companySubdomain,
    })
  );

  const plannedToday = await prisma.planEntry.count({
    where: {
      workDate: {
        gte: todayRange.start,
        lt: todayRange.endExclusive,
      },
      user: {
        companyId: session.companyId,
        isActive: true,
      },
    },
  });

  const absencesTodayRows = await prisma.absence.findMany({
  where: {
    absenceDate: {
      gte: todayRange.start,
      lt: todayRange.endExclusive,
    },
    user: {
      companyId: session.companyId,
      isActive: true,
    },
  },
  select: {
    userId: true,
    type: true,
    user: {
      select: {
        fullName: true,
      },
    },
  },
  orderBy: [
    {
      user: {
        fullName: "asc",
      },
    },
  ],
});

  const absentTodayEmployees: DashboardAbsenceRow[] = absencesTodayRows.map((row) => ({
    userId: row.userId,
    fullName: row.user.fullName,
    type: absenceTypeToApi(row.type),
  }));

  const absentTodaySet = new Set(absentTodayEmployees.map((row) => row.userId));

  const workedToday = await prisma.workEntry.findMany({
    where: {
      workDate: {
        gte: todayRange.start,
        lt: todayRange.endExclusive,
      },
      user: {
        companyId: session.companyId,
        isActive: true,
      },
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  const workedTodaySet = new Set(workedToday.map((x) => x.userId));

  const missingTodayEmployees: DashboardPersonRow[] = employeesRequiredToday
    .filter((employee) => !workedTodaySet.has(employee.id) && !absentTodaySet.has(employee.id))
    .map((employee) => ({
      userId: employee.id,
      fullName: employee.fullName,
    }));

  const absencesToday = absentTodayEmployees.length;
  const missingToday = missingTodayEmployees.length;

  const overdueMissingEmployeesRaw = await Promise.all(
    employees.map(async (employee) => {
      const missingDates = await getMissingRequiredWorkDates(employee.id, todayIso, {
        companyId: session.companyId,
      });

      if (missingDates.length === 0) {
        return null;
      }

      return {
        userId: employee.id,
        fullName: employee.fullName,
        missingDatesCount: missingDates.length,
        oldestMissingDate: missingDates[0],
        newestMissingDate: missingDates[missingDates.length - 1],
      };
    })
  );

  const overdueMissingEmployees: DashboardOverdueMissingRow[] =
    overdueMissingEmployeesRaw
      .filter((row): row is DashboardOverdueMissingRow => row !== null)
      .sort((a, b) => {
        if (a.oldestMissingDate !== b.oldestMissingDate) {
          return a.oldestMissingDate < b.oldestMissingDate ? -1 : 1;
        }
        return a.fullName.localeCompare(b.fullName);
      });

  const weekDays: string[] = [];
  {
    const cur = new Date(weekStart);
    for (let i = 0; i < 7; i += 1) {
      weekDays.push(dateOnlyLocalIso(cur));
      cur.setDate(cur.getDate() + 1);
    }
  }

  const workWeek = await prisma.workEntry.findMany({
    where: {
      workDate: {
        gte: new Date(`${weekDays[0]}T00:00:00.000Z`),
        lte: new Date(`${weekDays[6]}T00:00:00.000Z`),
      },
      user: {
        companyId: session.companyId,
      },
    },
    select: { userId: true, workDate: true },
  });

  const absencesWeek = await prisma.absence.findMany({
    where: {
      absenceDate: {
        gte: new Date(`${weekDays[0]}T00:00:00.000Z`),
        lte: new Date(`${weekDays[6]}T00:00:00.000Z`),
      },
      user: {
        companyId: session.companyId,
      },
    },
    select: { userId: true, absenceDate: true },
  });

  const weekPairs = new Set(
    workWeek.map((w) => `${w.userId}:${dateOnlyLocalIso(new Date(w.workDate))}`)
  );

  const absenceWeekPairs = new Set(
    absencesWeek.map((a) => `${a.userId}:${dateOnlyLocalIso(new Date(a.absenceDate))}`)
  );

  let missingWeek = 0;

  for (const employee of employees) {
    for (const day of weekDays) {
      const isRequired = isWorkEntryRequiredOnDateForUserMeta({
        currentYMD: day,
        fullName: employee.fullName,
        companySubdomain: session.companySubdomain,
      });

      if (!isRequired) continue;
      if (absenceWeekPairs.has(`${employee.id}:${day}`)) continue;
      if (weekPairs.has(`${employee.id}:${day}`)) continue;

      missingWeek += 1;
    }
  }

  const workEntriesMonth = await prisma.workEntry.findMany({
    where: {
      workDate: {
        gte: new Date(`${monthStartIso}T00:00:00.000Z`),
        lte: new Date(`${monthEndIso}T00:00:00.000Z`),
      },
      user: {
        companyId: session.companyId,
      },
    },
    select: {
      id: true,
      userId: true,
      workDate: true,
      startTime: true,
      endTime: true,
      activity: true,
      activitySourceLanguage: true,
      activityTranslations: true,
      location: true,
      locationSourceLanguage: true,
      locationTranslations: true,
      travelMinutes: true,
      breakMinutes: true,
      breakAuto: true,
      workMinutes: true,
      noteEmployee: true,
      noteEmployeeSourceLanguage: true,
      noteEmployeeTranslations: true,
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

  const dayBreaksMonth = await prisma.dayBreak.findMany({
    where: {
      workDate: {
        gte: new Date(`${monthStartIso}T00:00:00.000Z`),
        lte: new Date(`${monthEndIso}T00:00:00.000Z`),
      },
      user: {
        companyId: session.companyId,
      },
    },
    select: {
      userId: true,
      workDate: true,
      breakStartHHMM: true,
      breakEndHHMM: true,
      manualMinutes: true,
      legalMinutes: true,
      autoSupplementMinutes: true,
      effectiveMinutes: true,
    },
  });

  const absencesMonth = await prisma.absence.findMany({
    where: {
      absenceDate: {
        gte: new Date(`${monthStartIso}T00:00:00.000Z`),
        lte: new Date(`${monthEndIso}T00:00:00.000Z`),
      },
      user: {
        companyId: session.companyId,
      },
    },
    select: {
      userId: true,
      absenceDate: true,
      type: true,
      dayPortion: true,
      compensation: true,
    },
  });

  const dayBreakMap = new Map<string, TimelineDayBreak>();
  for (const row of dayBreaksMonth) {
    const workDate = dateOnlyLocalIso(new Date(row.workDate));
    dayBreakMap.set(`${row.userId}:${workDate}`, {
      workDate,
      breakStartHHMM: row.breakStartHHMM,
      breakEndHHMM: row.breakEndHHMM,
      manualMinutes: row.manualMinutes ?? 0,
      legalMinutes: row.legalMinutes ?? 0,
      autoSupplementMinutes: row.autoSupplementMinutes ?? 0,
      effectiveMinutes: row.effectiveMinutes ?? 0,
    });
  }

  const typedWorkEntriesMonth: WorkEntryMonthRow[] = workEntriesMonth.map((row) => ({
    id: row.id,
    userId: row.userId,
    workDate: row.workDate,
    startTime: row.startTime,
    endTime: row.endTime,
    activity: row.activity ?? null,
    activityTranslations: row.activityTranslations ?? null,
    location: row.location ?? null,
    locationTranslations: row.locationTranslations ?? null,
    travelMinutes: row.travelMinutes ?? 0,
    breakMinutes: row.breakMinutes ?? 0,
    breakAuto: row.breakAuto ?? false,
    workMinutes: row.workMinutes ?? 0,
    noteEmployee: row.noteEmployee ?? null,
    noteEmployeeTranslations: row.noteEmployeeTranslations ?? null,
    attachments: row.attachments.map((attachment) => ({
      id: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      url: `/api/work-entry-attachments/${encodeURIComponent(attachment.id)}/file`,
      createdAt: attachment.createdAt.toISOString(),
    })),
  }));

  const patchedWorkEntries = buildPatchedDashboardEntries(typedWorkEntriesMonth, dayBreakMap);

  const employeesTimeline = employees.map((employee) => {
    const items: Array<
      | {
          type: "WORK";
          id: string;
          date: string;
          startHHMM: string;
          endHHMM: string;
          activity: string | null;
          location: string | null;
          travelMinutes: number;
          breakMinutes: number;
          breakAuto: boolean;
          workMinutes: number;
          noteEmployee: string | null;
          attachments: AttachmentDTO[];
        }
      | {
        type: "VACATION" | "SICK";
        date: string;
        dayPortion: "FULL_DAY" | "HALF_DAY";
        compensation: "PAID" | "UNPAID";
      }
    > = [];

    const dayBreaks: TimelineDayBreak[] = [];

    for (const workEntry of typedWorkEntriesMonth) {
      if (workEntry.userId !== employee.id) continue;

      const date = dateOnlyLocalIso(new Date(workEntry.workDate));
      const startHHMM = toHHMMUTC(new Date(workEntry.startTime));
      const endHHMM = toHHMMUTC(new Date(workEntry.endTime));
      const patched = patchedWorkEntries.get(workEntry.id);

      const grossMinutes = Math.max(
        0,
        Math.round((workEntry.endTime.getTime() - workEntry.startTime.getTime()) / 60000)
      );

      items.push({
        type: "WORK",
        id: workEntry.id,
        date,
        startHHMM,
        endHHMM,
        activity: getTranslatedText(
          workEntry.activity,
          workEntry.activityTranslations,
          session.language
        ),
        location: getTranslatedText(
          workEntry.location,
          workEntry.locationTranslations,
          session.language
        ),
        travelMinutes: workEntry.travelMinutes ?? 0,
        breakMinutes: patched?.breakMinutes ?? workEntry.breakMinutes ?? 0,
        breakAuto: patched?.breakAuto ?? workEntry.breakAuto ?? false,
        workMinutes:
          patched?.workMinutes ??
          workEntry.workMinutes ??
          Math.max(0, grossMinutes),
        noteEmployee: getTranslatedText(
          workEntry.noteEmployee,
          workEntry.noteEmployeeTranslations,
          session.language
        ),
        attachments: workEntry.attachments,
      });
    }

    for (const [key, value] of dayBreakMap.entries()) {
      const [userId] = key.split(":");
      if (userId === employee.id) {
        dayBreaks.push(value);
      }
    }

    for (const absence of absencesMonth) {
      if (absence.userId !== employee.id) continue;

      const date = dateOnlyLocalIso(new Date(absence.absenceDate));
      items.push({
        type: absence.type === AbsenceType.VACATION ? "VACATION" : "SICK",
        date,
        dayPortion: absence.dayPortion === "HALF_DAY" ? "HALF_DAY" : "FULL_DAY",
        compensation: absence.compensation === "UNPAID" ? "UNPAID" : "PAID",
      });
    }

    items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    dayBreaks.sort((a, b) => (a.workDate < b.workDate ? -1 : a.workDate > b.workDate ? 1 : 0));

    return {
      userId: employee.id,
      fullName: employee.fullName,
      items,
      dayBreaks,
    };
  });

  const monthWorkAgg = await prisma.workEntry.aggregate({
    where: {
      workDate: {
        gte: new Date(`${monthStartIso}T00:00:00.000Z`),
        lte: new Date(`${monthEndIso}T00:00:00.000Z`),
      },
      user: {
        companyId: session.companyId,
      },
    },
    _sum: { workMinutes: true },
  });

  return NextResponse.json({
    ok: true,
    todayIso,
    weekRange: { from: dateOnlyLocalIso(weekStart), to: dateOnlyLocalIso(weekEnd) },
    monthRange: { from: monthStartIso, to: monthEndIso },
    cards: {
      plannedToday,
      absencesToday,
      missingToday,
      missingWeek,
      monthWorkMinutes: monthWorkAgg._sum.workMinutes ?? 0,
      employeesActive: employees.length,
      overdueMissingGeneral: overdueMissingEmployees.length,
    },
    todayActiveEmployees: activeEmployeesToday,
    todayMissingEmployees: missingTodayEmployees,
    todayAbsentEmployees: absentTodayEmployees,
    overdueMissingEmployees,
    employeesTimeline,
  });
}