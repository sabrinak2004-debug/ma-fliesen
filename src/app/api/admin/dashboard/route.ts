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

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Nicht eingeloggt" }, { status: 401 });

  // @ts-expect-error - je nach getSession shape
  const role = (session.role ?? session.user?.role) as Role | undefined;
  if (role !== Role.ADMIN) return NextResponse.json({ ok: false, error: "Kein Zugriff" }, { status: 403 });

  const now = new Date();
  const todayIso = dateOnlyLocalIso(now);

  const weekStart = startOfWeekMonday(now);
  const weekEnd = endOfWeekSunday(now);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthStartIso = dateOnlyLocalIso(monthStart);
  const monthEndIso = dateOnlyLocalIso(monthEnd);

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
  });
}