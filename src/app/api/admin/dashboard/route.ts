// src/app/api/admin/dashboard/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role, AbsenceType } from "@prisma/client";

function dateOnlyLocalIso(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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

type DashboardPersonRow = {
  userId: string;
  fullName: string;
};

type DashboardAbsenceRow = {
  userId: string;
  fullName: string;
  type: "VACATION" | "SICK";
};

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Nicht eingeloggt" }, { status: 401 });
  }

  if (session.role !== Role.ADMIN) {
    return NextResponse.json({ ok: false, error: "Kein Zugriff" }, { status: 403 });
  }

  const now = new Date();
  const todayIso = dateOnlyLocalIso(now);
  const url = new URL(req.url);
  const monthParam = url.searchParams.get("month") ?? todayIso.slice(0, 7);

  if (!/^\d{4}-\d{2}$/.test(monthParam)) {
    return NextResponse.json({ ok: false, error: "Ungültiger Monat." }, { status: 400 });
  }

  const monthStartIso = `${monthParam}-01`;
  const monthEndIso = `${monthParam}-${lastDayOfMonth(monthParam)}`;

  const weekStart = startOfWeekMonday(now);
  const weekEnd = endOfWeekSunday(now);

  const employees = await prisma.appUser.findMany({
    where: { isActive: true, role: Role.EMPLOYEE },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  const activeEmployeesToday: DashboardPersonRow[] = employees.map((employee) => ({
    userId: employee.id,
    fullName: employee.fullName,
  }));

  const plannedToday = await prisma.planEntry.count({
    where: { workDate: new Date(`${todayIso}T00:00:00.000Z`) },
  });

  const absencesTodayRows = await prisma.absence.findMany({
    where: { absenceDate: new Date(`${todayIso}T00:00:00.000Z`) },
    select: {
      userId: true,
      type: true,
      user: {
        select: {
          fullName: true,
        },
      },
    },
    orderBy: {
      user: {
        fullName: "asc",
      },
    },
  });

  const absentTodayEmployees: DashboardAbsenceRow[] = absencesTodayRows.map((row) => ({
    userId: row.userId,
    fullName: row.user.fullName,
    type: absenceTypeToApi(row.type),
  }));

  const absentTodaySet = new Set(absentTodayEmployees.map((row) => row.userId));

  const workedToday = await prisma.workEntry.findMany({
    where: { workDate: new Date(`${todayIso}T00:00:00.000Z`) },
    select: { userId: true },
    distinct: ["userId"],
  });

  const workedTodaySet = new Set(workedToday.map((x) => x.userId));

  const missingTodayEmployees: DashboardPersonRow[] = employees
    .filter((employee) => !workedTodaySet.has(employee.id) && !absentTodaySet.has(employee.id))
    .map((employee) => ({
      userId: employee.id,
      fullName: employee.fullName,
    }));

  const absencesToday = absentTodayEmployees.length;
  const missingToday = missingTodayEmployees.length;

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
    },
    select: { userId: true, workDate: true },
  });

  const weekPairs = new Set(workWeek.map((w) => `${w.userId}:${dateOnlyLocalIso(new Date(w.workDate))}`));
  const totalExpected = employees.length * weekDays.length;

  let presentCount = 0;
  for (const employee of employees) {
    for (const day of weekDays) {
      if (weekPairs.has(`${employee.id}:${day}`)) {
        presentCount += 1;
      }
    }
  }

  const missingWeek = Math.max(0, totalExpected - presentCount);

  const workEntriesMonth = await prisma.workEntry.findMany({
    where: {
      workDate: {
        gte: new Date(`${monthStartIso}T00:00:00.000Z`),
        lte: new Date(`${monthEndIso}T00:00:00.000Z`),
      },
    },
    select: {
      id: true,
      userId: true,
      workDate: true,
      startTime: true,
      endTime: true,
      activity: true,
      location: true,
      travelMinutes: true,
      breakMinutes: true,
      breakAuto: true,
      workMinutes: true,
      noteEmployee: true,
    },
  });

  const dayBreaksMonth = await prisma.dayBreak.findMany({
    where: {
      workDate: {
        gte: new Date(`${monthStartIso}T00:00:00.000Z`),
        lte: new Date(`${monthEndIso}T00:00:00.000Z`),
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
    },
    select: {
      userId: true,
      absenceDate: true,
      type: true,
      dayPortion: true,
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
        }
      | {
          type: "VACATION" | "SICK";
          date: string;
          dayPortion: "FULL_DAY" | "HALF_DAY";
        }
    > = [];

    const dayBreaks: TimelineDayBreak[] = [];

    for (const workEntry of workEntriesMonth) {
      if (workEntry.userId !== employee.id) continue;

      const date = dateOnlyLocalIso(new Date(workEntry.workDate));
      const startHHMM = toHHMMUTC(new Date(workEntry.startTime));
      const endHHMM = toHHMMUTC(new Date(workEntry.endTime));

      items.push({
        type: "WORK",
        id: workEntry.id,
        date,
        startHHMM,
        endHHMM,
        activity: workEntry.activity ?? null,
        location: workEntry.location ?? null,
        travelMinutes: workEntry.travelMinutes ?? 0,
        breakMinutes: workEntry.breakMinutes ?? 0,
        breakAuto: workEntry.breakAuto ?? false,
        workMinutes: workEntry.workMinutes ?? 0,
        noteEmployee: workEntry.noteEmployee ?? null,
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
    },
    todayActiveEmployees: activeEmployeesToday,
    todayMissingEmployees: missingTodayEmployees,
    todayAbsentEmployees: absentTodayEmployees,
    employeesTimeline,
  });
}