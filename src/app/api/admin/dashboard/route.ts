// src/app/api/admin/dashboard/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";

function dateOnlyLocalIso(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfWeekMonday(d: Date) {
  // Montag = 1, Sonntag = 0
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

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Nicht eingeloggt" }, { status: 401 });

  // @ts-expect-error - je nach getSession shape
  const role = (session.role ?? session.user?.role) as Role | undefined;
  if (role !== Role.ADMIN) return NextResponse.json({ ok: false, error: "Kein Zugriff" }, { status: 403 });

  const now = new Date();
  const todayIso = dateOnlyLocalIso(now);
  const url = new URL(req.url);
  const monthParam = url.searchParams.get("month") ?? todayIso.slice(0, 7);
  
  if (!/^\d{4}-\d{2}$/.test(monthParam)) {
    return NextResponse.json(
        { ok: false, error: "Ungültiger Monat." },
        { status: 400 }
    );
}

const monthStartIso = `${monthParam}-01`;
const monthEndIso = `${monthParam}-${lastDayOfMonth(monthParam)}`;


  const weekStart = startOfWeekMonday(now);
  const weekEnd = endOfWeekSunday(now);

  // Mitarbeiterliste (nur aktive EMPLOYEE)
  const employees = await prisma.appUser.findMany({
    where: { isActive: true, role: Role.EMPLOYEE },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  // Heutige Plan-Einsätze (alle)
  const plannedToday = await prisma.planEntry.count({
    where: { workDate: new Date(`${todayIso}T00:00:00.000Z`) },
  });

  // Abwesenheiten heute (Urlaub+Krank)
  const absencesToday = await prisma.absence.count({
    where: { absenceDate: new Date(`${todayIso}T00:00:00.000Z`) },
  });

  // Fehlende Einträge heute: Mitarbeiter ohne WorkEntry an diesem Datum (sehr simple)
  const workedToday = await prisma.workEntry.findMany({
    where: { workDate: new Date(`${todayIso}T00:00:00.000Z`) },
    select: { userId: true },
    distinct: ["userId"],
  });
  const workedTodaySet = new Set(workedToday.map((x) => x.userId));
  const missingToday = employees.filter((e) => !workedTodaySet.has(e.id)).length;

  // Fehlende Einträge diese Woche
  const weekDays: string[] = [];
  {
    const cur = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
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
  for (const e of employees) {
    for (const day of weekDays) {
      if (weekPairs.has(`${e.id}:${day}`)) presentCount += 1;
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
  },
});

const employeesTimeline = employees.map((e) => {
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
    }
  | {
      type: "VACATION" | "SICK";
      date: string;
    }
> = [];

  for (const w of workEntriesMonth) {
    if (w.userId !== e.id) continue;

    const d = new Date(w.workDate);
    const date = dateOnlyLocalIso(d);

    const start = new Date(w.startTime);
    const end = new Date(w.endTime);

    const startHHMM = `${String(start.getUTCHours()).padStart(2, "0")}:${String(
      start.getUTCMinutes()
    ).padStart(2, "0")}`;

    const endHHMM = `${String(end.getUTCHours()).padStart(2, "0")}:${String(
      end.getUTCMinutes()
    ).padStart(2, "0")}`;

        items.push({
        type: "WORK",
        id: w.id,
        date,
        startHHMM,
        endHHMM,
        activity: w.activity ?? null,
        location: w.location ?? null,
        travelMinutes: w.travelMinutes ?? 0,
        breakMinutes: w.breakMinutes ?? 0,
        breakAuto: w.breakAuto ?? false,
        workMinutes: w.workMinutes ?? 0,
        });
  }

  for (const a of absencesMonth) {
    if (a.userId !== e.id) continue;

    const d = new Date(a.absenceDate);
    const date = dateOnlyLocalIso(d);

    items.push({
      type: a.type,
      date,
    });
  }

  items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return {
    userId: e.id,
    fullName: e.fullName,
    items,
  };
});


  // Überstunden Monat (wenn du schon "monthlyTargets" oder Sollstunden logik hast, integrieren wir das später sauber)
  // Hier: einfache Summe workMinutes im Monat (nur als Kennzahl)
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
    employeesTimeline,
  });
}